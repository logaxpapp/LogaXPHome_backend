// /src/services/Task/boardMembershipService.ts

import mongoose from 'mongoose';
import Board, { IBoard, IBoardPopulated } from '../../models/Task/Board';
import Team, { ITeam, ITeamMember } from '../../models/Team';
import { IUser } from '../../models/User';
import { UserRole } from '../../types/enums';
/**
 * Add a user to a board, ensuring they belong to the team
 * @param boardId - The board's ID
 * @param userId - The user to add
 * @param currentUser - The user performing the action (must be owner or team leader)
 */
export const addMemberToBoard = async (
  boardId: string,
  userId: string,
  currentUser: IUser
): Promise<IBoard> => {
  // 1. Fetch the board
  const board = await Board.findById(boardId).populate('team');
  if (!board) {
    throw new Error('Board not found');
  }

  // 2. Check if current user is the owner or team leader
  // Must also ensure the board.team is populated
  if (!board.team || board.team instanceof mongoose.Types.ObjectId) {
    throw new Error('Board team not fully populated');
  }
  const team = board.team as ITeam;

  // Check if currentUser is owner
  const isOwner = board.owner.toString() === currentUser._id.toString();

  // Or is a Leader in the team
  let isLeader = false;
  team.members.forEach((member: ITeamMember) => {
    if (
      member.user.toString() === currentUser._id.toString() &&
      member.role === 'Leader'
    ) {
      isLeader = true;
    }
  });
  if (!isOwner && !isLeader) {
    throw new Error('Access denied: Must be board owner or team leader');
  }

  // 3. Ensure the user to add is in the same team
  const isMemberOfTeam = team.members.some(
    (member) => member.user.toString() === userId
  );
  if (!isMemberOfTeam) {
    throw new Error('User does not belong to the same team');
  }

  // 4. Add user to board.members if not already added
  const alreadyInBoard = board.members.some(
    (m) => m.toString() === userId
  );
  if (!alreadyInBoard) {
    board.members.push(new mongoose.Types.ObjectId(userId));
    await board.save();
  }

  return board;
};

/**
 * Remove a user from a board
 * @param boardId - The board's ID
 * @param userId - The user to remove
 * @param currentUser - The user performing the action
 */
export const removeMemberFromBoard = async (
  boardId: string,
  userId: string,
  currentUser: IUser
): Promise<IBoard> => {
  // 1. Fetch board, populate team
  const board = await Board.findById(boardId).populate('team');
  if (!board) {
    throw new Error('Board not found');
  }

  if (!board.team || board.team instanceof mongoose.Types.ObjectId) {
    throw new Error('Board team not fully populated');
  }
  const team = board.team as ITeam;

  // 2. Check if current user is owner or leader
  const isOwner = board.owner.toString() === currentUser._id.toString();
  let isLeader = false;
  team.members.forEach((member: ITeamMember) => {
    if (
      member.user.toString() === currentUser._id.toString() &&
      member.role === 'Leader'
    ) {
      isLeader = true;
    }
  });

  if (!isOwner && !isLeader) {
    throw new Error('Access denied: Must be board owner or team leader');
  }

  // 3. Remove user from board.members
  board.members = board.members.filter(
    (m) => m.toString() !== userId
  );
  await board.save();

  return board;
};
/**
 * Return the board members if the current user is authorized:
 * - board owner
 * - admin
 * - already in the board
 * - or a team leader of the board's team
 */
export const getBoardMembers = async (
  boardId: string,
  currentUser: IUser
): Promise<IUser[]> => {
  // 1) Fetch the board, populating members & team
  const boardDoc = await Board.findById(boardId)
    .populate('members', 'name email role') // user fields to return
    .populate('team')                      // we might need to check team leadership
    .lean<IBoardPopulated>();             // returns a plain JS object

  if (!boardDoc) {
    throw new Error('Board not found');
  }

  // 2) Check if the current user is:
  //    (A) The board owner,
  //    (B) An admin user,
  //    (C) Already a board member,
  //    (D) A leader in the team.

  // (A) Board owner
  const isOwner = boardDoc.owner.toString() === currentUser._id.toString();

  // (B) Admin user
  const isAdmin = currentUser.role === UserRole.Admin;

  // (C) Already a board member
  const inBoard = boardDoc.members.some(
    (m) => m._id.toString() === currentUser._id.toString()
  );

  // (D) Team leader check
  let isTeamLeader = false;
  // Check if boardDoc.team is an actual object (not just an ObjectId).
  if (boardDoc.team && typeof boardDoc.team === 'object') {
    const teamDoc = boardDoc.team as ITeam; // cast to ITeam
    if (teamDoc.members && Array.isArray(teamDoc.members)) {
      isTeamLeader = teamDoc.members.some((member) => {
        return (
          member.user.toString() === currentUser._id.toString() &&
          member.role === 'Leader'
        );
      });
    }
  }

  // 3) If current user is none of the above => deny access
  if (!isOwner && !isAdmin && !inBoard && !isTeamLeader) {
    throw new Error(
      'Access denied: Must be board owner, admin, team leader, or a board member'
    );
  }

  // 4) Return the list of board members
  return boardDoc.members;
};
  // EXAMPLE: setBoardTeam
//  - boardId: which board to update
//  - teamId: which team to attach
//  - currentUser: user performing the action
//  - optionally: syncMembers => if true, we copy the team's members to the board.members
export const setBoardTeam = async (
  boardId: string,
  teamId: string,
  currentUser: IUser,
  syncMembers: boolean = true,
): Promise<IBoard> => {
  // 1. Find board
  const board = await Board.findById(boardId);
  if (!board) {
    throw new Error('Board not found');
  }

  // 2. Check if currentUser is board owner or admin
  const isOwner = board.owner.toString() === currentUser._id.toString();
  const isAdmin = currentUser.role === UserRole.Admin;
  if (!isOwner && !isAdmin) {
    throw new Error('Access denied: Must be board owner or admin');
  }

  // 3. Find team
  const team = await Team.findById(teamId).populate('members.user');
  if (!team) {
    throw new Error('Team not found');
  }

  // 4. Assign board.team
  board.team = team._id;

  // 5. Optionally sync the board’s `members` to match the team’s users
  if (syncMembers) {
    // Clear or reset board.members
    board.members = [];
    team.members.forEach((member) => {
      board.members.push(member.user._id); // Ensure it's an ObjectId
    });
  }

  await board.save();
  return board;
};

// EXAMPLE: removeBoardTeam
//  - boardId: which board to update
//  - currentUser: who’s performing the action
//  - optionally: also clear board.members
export const removeBoardTeam = async (
  boardId: string,
  currentUser: IUser,
  alsoClearMembers: boolean = true,
): Promise<IBoard> => {
  // 1. Find board
  const board = await Board.findById(boardId);
  if (!board) {
    throw new Error('Board not found');
  }

  // 2. Check if currentUser is board owner or admin
  const isOwner = board.owner.toString() === currentUser._id.toString();
  const isAdmin = currentUser.role === UserRole.Admin;
  if (!isOwner && !isAdmin) {
    throw new Error('Access denied: Must be board owner or admin');
  }

  // 3. Remove the team
  board.team = undefined as any; // or null, depending on your schema

  // 4. Optionally clear board.members too
  if (alsoClearMembers) {
    board.members = [];
  }

  await board.save();
  return board;
};