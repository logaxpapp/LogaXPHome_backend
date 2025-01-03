// src/middlewares/authorizeBoardAccess.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import Board from '../models/Task/Board';
import { IUser } from '../models/User';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Middleware to authorize board access if user is in board.members
 * or if user is an admin.
 */
export const authorizeBoardAccess: RequestHandler = async (
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

    // If user role is admin, skip membership check.
    const user = req.user!;
    if (user.role === 'admin') {
      // Attach board to request for further use if needed
      (req as any).board = board;
      return next();
    }

    // Otherwise, check if user is a member of the board
    const userIdString = user._id.toString();
    const isMember = board.members
      .map((id) => id.toString())
      .includes(userIdString);

    if (!isMember) {
      res.status(403).json({ message: 'Access denied to this board' });
      return;
    }

    // Attach board to request for further use if needed
    (req as any).board = board;

    next();
  } catch (error) {
    next(error);
  }
};
