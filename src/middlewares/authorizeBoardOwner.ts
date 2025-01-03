// src/middlewares/authorizeBoardOwner.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import Board from '../models/Task/Board';
import { IUser } from '../models/User';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authorizeBoardOwner: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { boardId } = req.params;

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isOwner = board.owner.toString() === userId;

    if (!isOwner) {
      res.status(403).json({ message: 'Only the board owner can perform this action' });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
