// /src/services/Task/boardMembershipService.ts

import mongoose from 'mongoose';
import Board, { IBoard, IBoardPopulated } from '../../models/Task/Board';
import Team, { ITeam, ITeamMember } from '../../models/Team';
import { IUser } from '../../models/User';

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

export const getBoardMembers = async (
    boardId: string,
    currentUser: IUser
  ): Promise<IUser[]> => {
    const boardDoc = await Board.findById(boardId)
      .populate('members', 'name email role')
      .populate('team')
      .lean<IBoardPopulated>(); // <-- Return a plain object typed as IBoardPopulated
  
    if (!boardDoc) {
      throw new Error('Board not found');
    }
  
    // boardDoc is typed as IBoardPopulated, so `members` is IUser[]
    const inBoard = boardDoc.members.some(
      (m) => m._id.toString() === currentUser._id.toString()
    );
    if (!inBoard) {
      throw new Error('Access denied: not a board member');
    }
  
    return boardDoc.members; // perfectly typed as IUser[]
  };