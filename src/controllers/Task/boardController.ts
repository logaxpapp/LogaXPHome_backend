// /src/controllers/Task/boardController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  updateBoardLists,
} from '../../services/Task/boardService';
import Board from '../../models/Task/Board';
import Team, { ITeam, ITeamMember } from '../../models/Team';
import { IUser } from '../../models/User';
import List from '../../models/Task/List';

/**
 * Extended Request interface for user
 */
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const getBoardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      res.status(400).json({ message: 'Invalid Board ID' });
      return;
    }

    const board = await getBoardById(boardId);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Allow admin to access all boards
    if (req.user.role === 'admin') {
      res.status(200).json(board);
      return;
    }

    // Check membership for non-admin users
    const isMember = board.members.some(
      (member) => member.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.status(200).json(board);
  } catch (error: any) {
    next(error);
  }
};
export const createBoardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, teamId } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!name || !teamId) {
      res.status(400).json({ message: 'Name and teamId are required' });
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    const isOwnerMember = team.members.some(
      (member) => member.user.toString() === req.user!._id.toString()
    );

    const isAdmin = req.user.role === 'admin';

    console.log('isOwnerMember:', isOwnerMember);
    console.log('isAdmin:', isAdmin);
    console.log('Team:', team);

    if (!isOwnerMember && !isAdmin) {
      res.status(403).json({ message: 'Owner must be a member of the team' });
      return;
    }

    // Pass the full user object to the service
    const board = await createBoard({
      name,
      description,
      owner: req.user, // Full user object
      team: teamId,
    });

    res.status(201).json(board);
  } catch (error) {
    console.error('Error creating board:', error);
    next(error);
  }
};

/**
 * Handler to update a board
 */
export const updateBoardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      res.status(400).json({ message: 'Invalid Board ID' });
      return;
    }

    const board = await getBoardById(boardId);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Allow admin to bypass ownership or leadership checks
    if (req.user.role === 'admin') {
      const updatedBoard = await updateBoard(boardId, updates);
      res.status(200).json(updatedBoard);
      return;
    }

    // Check if user is owner or leader
    const isOwner = board.owner.toString() === req.user._id.toString();
    let isLeader = false;

    if (board.team && !(board.team instanceof mongoose.Types.ObjectId)) {
      const team = board.team as ITeam;
      isLeader = team.members.some(
        (member: ITeamMember) =>
          member.user.toString() === req.user!._id.toString() && member.role === 'Leader'
      );
    }

    if (!isOwner && !isLeader) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const updatedBoard = await updateBoard(boardId, updates);
    res.status(200).json(updatedBoard);
  } catch (error: any) {
    next(error);
  }
};


/**
 * Handler to delete a board
 */
export const deleteBoardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;

    // 1) Validate boardId
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
       res.status(400).json({ message: 'Invalid Board ID' });
        return;
    }

    // 2) Fetch board
    const board = await getBoardById(boardId);
    if (!board) {
       res.status(404).json({ message: 'Board not found' });
        return;
    }

    // 3) Must have a logged-in user
    if (!req.user) {
       res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    // Allow admin to delete any board
    if (req.user.role === 'admin') {
      await deleteBoard(boardId);
       res.status(200).json({ message: 'Board deleted successfully' });
        return;
    }

    // 4) Check if user is owner or team leader
    const isOwner = board.owner.toString() === req.user._id.toString();

    let isLeader = false;
    if (board.team && !(board.team instanceof mongoose.Types.ObjectId)) {
      const team = board.team as ITeam;
      isLeader = team.members.some((member: ITeamMember) => {
        return (
          member.user.toString() === req.user!._id.toString() &&
          member.role === 'Leader'
        );
      });
    }

    if (!isOwner && !isLeader) {
       res.status(403).json({ message: 'Access denied' });
        return;
    }

    // 5) Delete
    await deleteBoard(boardId);
     res.status(200).json({ message: 'Board deleted successfully' });
     return;
  } catch (error: any) {
    next(error);
  }
};

/**
 * Handler to update board lists
 */
export const updateBoardListsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const { lists } = req.body; // e.g. [listId1, listId2, ...]

    // 1) Validate boardId
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
       res.status(400).json({ message: 'Invalid Board ID' });
        return;
    }

    // 2) Fetch board
    const board = await getBoardById(boardId);
    if (!board) {
       res.status(404).json({ message: 'Board not found' });
        return;
    }

    // 3) Must have a logged-in user
    if (!req.user) {
       res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    // 4) Check if user is owner or team leader
    const isOwner = board.owner.toString() === req.user._id.toString();

    let isLeader = false;
    if (board.team && !(board.team instanceof mongoose.Types.ObjectId)) {
      const team = board.team as ITeam;
      isLeader = team.members.some((member: ITeamMember) => {
        return (
          member.user.toString() === req.user!._id.toString() &&
          member.role === 'Leader'
        );
      });
    }

    if (!isOwner && !isLeader) {
       res.status(403).json({ message: 'Access denied' });
        return;
    }

    // 5) Update lists
    const updatedBoard = await updateBoardLists(boardId, lists);
    res.status(200).json(updatedBoard);
  } catch (error: any) {
    next(error);
  }
};

export const getAllBoardsHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1) Must have a logged-in user
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const query = req.user.role === 'admin' 
      ? {} // Admin sees all boards
      : { members: req.user._id }; // Non-admin sees only boards they're a member of

    // 2) Fetch boards based on query
    const boards = await Board.find(query)
      .populate({
        path: 'team',
        select: 'name description members',
        populate: {
          path: 'members.user',
          select: 'name email role',
        },
      })
      .populate({
        path: 'lists',
        populate: {
          path: 'cards',
          populate: {
            path: 'assignees',
            select: 'name email',
          },
        },
      })
      .populate('labels')
      .exec();

    res.status(200).json(boards);
  } catch (error: any) {
    next(error);
  }
};



export const updateHeader = async (req: Request, res: Response) => {
    const { listId, newHeader } = req.body;
  
    try {
      const updatedList = await List.findByIdAndUpdate(
        listId,
        { header: newHeader },
        { new: true }
      );
      res.status(200).json(updatedList);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update header.' });
    }
  };
  