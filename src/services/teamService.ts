import mongoose from 'mongoose';
import Team, { ITeam } from '../models/Team';
import User, { IUser } from '../models/User';
import { UserRole } from '../types/enums';

/**
 * Interface for pagination and search filtering
 */
interface GetTeamsFilters {
  search?: string;
  role?: string; // Role to filter members by
  page: number;
  limit: number;
}

/**
 * CreateTeamInput for creating a Board Team
 */
interface CreateTeamInput {
  name: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId; // The user who owns this team
}

/**
 * Create a new Board Team with a single 'Leader' (the owner).
 */
export const createBoardTeam = async (input: CreateTeamInput): Promise<ITeam> => {
  const { name, description, ownerId } = input;

  // Create the team doc
  const team = new Team({
    name,
    description,
    owner: ownerId,
    // The owner is automatically the 'Leader'
    members: [
      {
        user: ownerId,
        role: 'Leader',
      },
    ],
  });

  await team.save();
  return team;
};
/**
 * Create a new team
 * - Only Admins or Contractors can create teams
 */
export const createTeam = async (ownerId: string, data: Partial<ITeam>): Promise<ITeam> => {
  // 1) Verify the owner user
  const owner = await User.findById(ownerId);
  if (!owner) {
    throw new Error('Owner not found.');
  }

  // 2) Check role: Must be Admin or Contractor
  if (![UserRole.Admin, UserRole.Contractor].includes(owner.role)) {
    throw new Error('Only Admins or Contractors can create teams.');
  }

  // 3) Construct the team (but do not save yet)
  const team = new Team({
    ...data,
    owner: owner._id,
  });

  // 4) Make sure the owner is in members[] as 'Leader'
  const isOwnerAlreadyMember = team.members?.some(
    (member) => member.user.toString() === owner._id.toString()
  );

  if (!isOwnerAlreadyMember) {
    team.members.push({
      user: owner._id,
      role: 'Leader',
    });
  }

  // 5) Save the team
  const savedTeam = await team.save();

  // 6) Update owner's teamsManaged
  owner.teamsManaged = owner.teamsManaged || [];
  owner.teamsManaged.push(savedTeam._id);
  await owner.save();

  return savedTeam;
};


/**
 * Get all teams belonging to a manager with search, filter, and pagination
 * - If user is Admin, can skip the 'owner' constraint
 */
export const getTeamsByManagerWithFilters = async (
  ownerId: string,
  filters: GetTeamsFilters
): Promise<{ teams: ITeam[]; total: number; page: number; pages: number }> => {
  const { search, role, page, limit } = filters;

  // Build a query that ensures `owner: ownerId` unless user is admin
  const query: any = { owner: ownerId };

  if (search) {
    query.$text = { $search: search };
  }
  if (role) {
    query['members.role'] = role;
  }

  // Count and fetch
  const total = await Team.countDocuments(query);
  const pages = Math.ceil(total / limit);

  const teams = await Team.find(query)
    .populate('members.user')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return { teams, total, page, pages };
};

/**
 * Get all teams (bypassing owner constraint) with search/filter/pagination
 * - This is for Admin usage primarily
 */
export const getAllTeamsWithFilters = async (
  filters: GetTeamsFilters
): Promise<{ teams: ITeam[]; total: number; page: number; pages: number }> => {
  const { search, role, page, limit } = filters;
  const query: any = {};

  if (search) {
    query.$text = { $search: search };
  }
  if (role) {
    query['members.role'] = role;
  }

  const total = await Team.countDocuments(query);
  const pages = Math.ceil(total / limit);

  const teams = await Team.find(query)
    .populate('members.user')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return { teams, total, page, pages };
};

/**
 * Get all teams managed by a manager (Admin or Contractor)
 */
export const getTeamsByManager = async (ownerId: string): Promise<ITeam[]> => {
  return Team.find({ owner: ownerId }).populate('members');
};

/**
 * Get a team by ID, ensuring it is managed by the requesting manager
 * or the requesting user is Admin
 */
export const getTeamById = async (ownerId: string, teamId: string): Promise<ITeam | null> => {
  // We'll do the 'admin' check outside or inside the calling layer
  return Team.findOne({ _id: teamId, owner: ownerId })
    .populate({
      path: 'members.user',
      select: 'name email role',
    });
};

/**
 * Update a team
 * - Must be the team owner or an Admin
 */
export const updateTeam = async (
  ownerId: string,
  teamId: string,
  updates: Partial<ITeam>
): Promise<ITeam | null> => {
  // If user is admin, we won't check owner, but that logic can be done in the controller
  const team = await Team.findOneAndUpdate(
    { _id: teamId, owner: ownerId },
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('members');

  return team;
};

/**
 * Delete a team
 * - Must be the team owner or an Admin
 */
export const deleteTeam = async (ownerId: string, teamId: string): Promise<boolean> => {
  const result = await Team.deleteOne({ _id: teamId, owner: ownerId });

  if (result.deletedCount === 1) {
    // Remove from owner's teamsManaged
    await User.findByIdAndUpdate(ownerId, { $pull: { teamsManaged: teamId } });

    // Remove the team from all members' "teams" array
    await User.updateMany({ teams: teamId }, { $pull: { teams: teamId } });
    return true;
  }

  return false;
};

/**
 * Add a member to a team with a specific role
 * - Must be the team owner or Admin
 */
export const addMemberToTeam = async (
  ownerId: string,
  teamId: string,
  memberId: string,
  role: 'Leader' | 'Member' | 'Viewer' = 'Member'
): Promise<ITeam | null> => {
  // 1) Fetch the owner for role check
  const owner = await User.findById(ownerId);
  if (!owner) {
    throw new Error('Owner not found.');
  }

  const isAdmin = owner.role === UserRole.Admin; // [NEW: Admin can do all]

  // 2) Fetch the member being added
  const member = await User.findById(memberId);
  if (!member) {
    throw new Error('Member not found.');
  }

  // 3) If not admin, ensure the user is subContractor
  if (!isAdmin && member.role !== UserRole.SubContractor) {
    throw new Error('Only Admins can add users other than SubContractors.');
  }

  // 4) If assigning Leader, ensure no existing leader
  if (role === 'Leader') {
    const existingLeader = await Team.findOne({
      _id: teamId,
      'members.role': 'Leader',
    });
    if (existingLeader) {
      throw new Error('A leader already exists for this team.');
    }
  }

  // 5) Add the member to the team
  const team = await Team.findOneAndUpdate(
    { _id: teamId, owner: isAdmin ? { $exists: true } : ownerId }, // [NEW: if isAdmin => skip owner check]
    { $addToSet: { members: { user: memberId, role } } },
    { new: true }
  ).populate({
    path: 'members.user',
    select: 'name email role',
  });

  // 6) Optionally add the team to the user's "teams" array
  if (team && member) {
    if (!member.teams) {
      member.teams = [];
    }
    if (!member.teams.includes(team._id)) {
      member.teams.push(team._id);
      await member.save();
    }
  }

  return team;
};

/**
 * Remove a member from a team
 * - Must be the team owner or Admin
 */
export const removeMemberFromTeam = async (
  ownerId: string,
  teamId: string,
  memberId: string
): Promise<ITeam | null> => {
  // If admin => skip the "owner" check in the filter
  const ownerFilter = { _id: teamId } as any;
  if (!ownerId) {
    throw new Error('No ownerId provided.');
  }
  const userDoc = await User.findById(ownerId);
  const isAdmin = userDoc?.role === UserRole.Admin; // [NEW: Admin can do all]
  if (!isAdmin) {
    ownerFilter.owner = ownerId;
  }

  // 1) Remove the member from the team
  const team = await Team.findOneAndUpdate(
    ownerFilter,
    { $pull: { members: { user: memberId } } },
    { new: true }
  ).populate('members.user');

  // 2) Optionally remove the team from the member's teams array
  //    If you want to keep consistency
  /*
  if (team) {
    await User.findByIdAndUpdate(memberId, { $pull: { teams: teamId } });
  }
  */

  return team;
};

/**
 * Update a member's role
 * - Must be the team owner or Admin
 */
export const updateMemberRole = async (
  ownerId: string,
  teamId: string,
  memberId: string,
  newRole: 'Leader' | 'Member' | 'Viewer'
): Promise<ITeam | null> => {
  // Check if this user is admin first
  const userDoc = await User.findById(ownerId);
  const isAdmin = userDoc?.role === UserRole.Admin; // [NEW: Admin can do all]

  // If the new role is 'Leader', ensure there's no existing leader
  if (newRole === 'Leader') {
    const existingLeader = await Team.findOne({
      _id: teamId,
      'members.role': 'Leader',
    });
    if (existingLeader) {
      throw new Error('A leader already exists for this team.');
    }
  }

  // Build the filter
  const filter: any = { _id: teamId, 'members.user': memberId };
  if (!isAdmin) {
    filter.owner = ownerId;
  }

  // Perform the update
  const team = await Team.findOneAndUpdate(
    filter,
    { $set: { 'members.$.role': newRole } },
    { new: true }
  ).populate('members.user');

  return team;
};
