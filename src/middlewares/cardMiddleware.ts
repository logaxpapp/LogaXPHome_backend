// src/middlewares/authorizeCardAccess.ts

import { Request, Response, NextFunction } from 'express';
import Card from '../models/Task/Card';
import { IUser } from '../models/User';
import Board from '../models/Task/Board';
import { IBoard, IPopulatedCard, IListPopulated } from '../types/task'; // Import populated interfaces

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authorizeCardAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cardId } = req.params;

    // Perform deep population: populate 'list' and within 'list', populate 'board'
    const card = await Card.findById(cardId)
      .populate({
        path: 'list',
        populate: { path: 'board' },
      });

    // Type assertion to ICardPopulated | null
    const populatedCard = card as IPopulatedCard | null;

    if (!populatedCard) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    // Access the populated board
    const boardId = populatedCard.list.board._id.toString();
    const board = await Board.findById(boardId);

    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    // Check if the user is a member of the board
    const isMember = board.members.some(
      (memberId) => memberId.toString() === req.user!._id.toString()
    );

    if (!isMember) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    next();
  } catch (error: any) {
    next(error);
  }
};
