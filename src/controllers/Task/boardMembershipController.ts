// /src/controllers/Task/boardMembershipController.ts

import { Request, Response, NextFunction } from 'express';
import { addMemberToBoard, removeMemberFromBoard, getBoardMembers } from '../../services/Task/boardMembershipService';
import { IUser } from '../../models/User';
import mongoose from 'mongoose';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Add a member to a board
 * POST /boards/:boardId/members
 * Body: { userId: string }
 */
export const addMemberToBoardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const { userId } = req.body;

    // 1) Validate IDs
    if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid boardId or userId' });
        return;
    }

    // 2) Must have a logged-in user
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    // 3) Add member
    const updatedBoard = await addMemberToBoard(boardId, userId, req.user);
     res.status(200).json(updatedBoard);
     return;
  } catch (error: any) {
    next(error);
  }
};

/**
 * Remove a member from a board
 * DELETE /boards/:boardId/members/:userId
 */
export const removeMemberFromBoardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid boardId or userId' });
        return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const updatedBoard = await removeMemberFromBoard(boardId, userId, req.user);
    res.status(200).json(updatedBoard);
    return;
  } catch (error: any) {
    next(error);
  }
};

/**
 * Fetch board members
 * GET /boards/:boardId/members
 */
export const getBoardMembersHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      res.status(400).json({ message: 'Invalid boardId' });
        return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const members = await getBoardMembers(boardId, req.user);
    res.status(200).json(members);
    return;
  } catch (error: any) {
    next(error);
  }
};