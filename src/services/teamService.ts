// src/services/teamService.ts

import Team, { ITeam } from '../models/Team';
import User, { IUser } from '../models/User';
import { UserRole } from '../types/enums';
import mongoose from 'mongoose';

interface GetTeamsFilters {
    search?: string;
    role?: string; // Role to filter members by
    page: number;
    limit: number;
  }

  interface CreateTeamInput {
    name: string;
    description?: string;
    ownerId: mongoose.Types.ObjectId;  // The user who owns this team
  }

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
 * @param ownerId - ID of the owner (Admin or Contractor)
 * @param data - Team data
 */
export const createTeam = async (ownerId: string, data: Partial<ITeam>): Promise<ITeam> => {
  // Verify that the owner exists and has appropriate role
  const owner = await User.findById(ownerId);
  if (!owner) {
    throw new Error('Owner not found.');
  }

  if (![UserRole.Admin, UserRole.Contractor].includes(owner.role)) {
    throw new Error('Only Admins and Contractors can create teams.');
  }

  // Create the team
  const team = new Team({
    ...data,
    owner: owner._id,
  });

  // Save the team
  const savedTeam = await team.save();

  // Update owner's teamsManaged
  owner.teamsManaged = owner.teamsManaged || [];
  owner.teamsManaged.push(savedTeam._id);
  await owner.save();

  return savedTeam;
};

/**
 * Get all teams managed by a manager with filters and pagination
 * @param ownerId - ID of the manager
 * @param filters - Filtering options
 */
export const getTeamsByManagerWithFilters = async (
    ownerId: string,
    filters: GetTeamsFilters
  ): Promise<{ teams: ITeam[]; total: number; page: number; pages: number }> => {
    const { search, role, page, limit } = filters;
    const query: any = { owner: ownerId };
  
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
 * @param ownerId - ID of the manager
 */
export const getTeamsByManager = async (ownerId: string): Promise<ITeam[]> => {
  return Team.find({ owner: ownerId }).populate('members');
};

/**
 * Get a team by ID, ensuring it is managed by the requesting manager
 * @param ownerId - ID of the manager
 * @param teamId - ID of the team
 */
export const getTeamById = async (ownerId: string, teamId: string): Promise<ITeam | null> => {
  return Team.findOne({ _id: teamId, owner: ownerId }).populate('members');
};

/**
 * Update a team
 * @param ownerId - ID of the manager
 * @param teamId - ID of the team
 * @param updates - Fields to update
 */
export const updateTeam = async (ownerId: string, teamId: string, updates: Partial<ITeam>): Promise<ITeam | null> => {
  // Find and update the team
  const team = await Team.findOneAndUpdate(
    { _id: teamId, owner: ownerId },
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('members');

  return team;
};

/**
 * Delete a team
 * @param ownerId - ID of the manager
 * @param teamId - ID of the team
 */
export const deleteTeam = async (ownerId: string, teamId: string): Promise<boolean> => {
  const result = await Team.deleteOne({ _id: teamId, owner: ownerId });

  if (result.deletedCount === 1) {
    // Remove the team from owner's teamsManaged
    await User.findByIdAndUpdate(ownerId, { $pull: { teamsManaged: teamId } });

    // Remove the team from all members' teams
    await User.updateMany({ teams: teamId }, { $pull: { teams: teamId } });

    return true;
  }

  return false;
};

/**
 * Add a member (SubContractor) to a team with a specific role
 * @param ownerId - ID of the manager
 * @param teamId - ID of the team
 * @param memberId - ID of the SubContractor to add
 * @param role - Role to assign to the member
 */
export const addMemberToTeam = async (
    ownerId: string,
    teamId: string,
    memberId: string,
    role: 'Leader' | 'Member' | 'Viewer' = 'Member'
  ): Promise<ITeam | null> => {
    // Verify that the member is a SubContractor
    const member = await User.findById(memberId);
    if (!member || member.role !== UserRole.SubContractor) {
      throw new Error('Member must be a valid SubContractor.');
    }
  
    // Check if a leader already exists if assigning the Leader role
    if (role === 'Leader') {
      const existingLeader = await Team.findOne({
        _id: teamId,
        'members.role': 'Leader',
      });
      if (existingLeader) {
        throw new Error('A leader already exists for this team.');
      }
    }
  
    // Add the member to the team with the specified role
    const team = await Team.findOneAndUpdate(
      { _id: teamId, owner: ownerId },
      { $addToSet: { members: { user: memberId, role } } }, // Prevent duplicates
      { new: true }
    ).populate('members.user');
  
    if (team) {
      // Optionally, add the team to the member's teams if such a field exists
      // member.teams = member.teams || [];
      // member.teams.push(team._id);
      // await member.save();
    }
  
    return team;
  };

/**
 * Remove a member (SubContractor) from a team
 * @param ownerId - ID of the manager
 * @param teamId - ID of the team
 * @param memberId - ID of the SubContractor to remove
 */
export const removeMemberFromTeam = async (
    ownerId: string,
    teamId: string,
    memberId: string
  ): Promise<ITeam | null> => {
    // Remove the member from the team
    const team = await Team.findOneAndUpdate(
      { _id: teamId, owner: ownerId },
      { $pull: { members: { user: memberId } } },
      { new: true }
    ).populate('members.user');
  
    if (team) {
      // Optionally, remove the team from the member's teams if such a field exists
      // await User.findByIdAndUpdate(memberId, { $pull: { teams: teamId } });
    }
  
    return team;
  };
  

  /**
 * Update a team member's role
 * @param ownerId - ID of the manager
 * @param teamId - ID of the team
 * @param memberId - ID of the SubContractor
 * @param newRole - New role to assign
 */
export const updateMemberRole = async (
    ownerId: string,
    teamId: string,
    memberId: string,
    newRole: 'Leader' | 'Member' | 'Viewer'
  ): Promise<ITeam | null> => {
    if (newRole === 'Leader') {
      const existingLeader = await Team.findOne({
        _id: teamId,
        'members.role': 'Leader',
      });
      if (existingLeader) {
        throw new Error('A leader already exists for this team.');
      }
    }
  
    const team = await Team.findOneAndUpdate(
      { _id: teamId, owner: ownerId, 'members.user': memberId },
      { $set: { 'members.$.role': newRole } },
      { new: true }
    ).populate('members.user');
  
    return team;
  };
  
