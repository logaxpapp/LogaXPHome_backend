// src/controllers/Task/labelController.ts

import { Request, Response, NextFunction } from 'express';
import {
  createLabel,
  deleteLabel,
  getLabelById,
  getLabelsByBoard,
} from '../../services/Task/labelService';
import { IUser } from '../../models/User';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// --------------------------- CREATE LABEL ---------------------------
export const createLabelHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, color, boardId } = req.body;
    console.log('boardId', boardId);
    const label = await createLabel({ name, color, board: boardId });
    res.status(201).json(label);
  } catch (error: any) {
    next(error);
  }
};

// --------------------------- DELETE LABEL ---------------------------
export const deleteLabelHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { labelId } = req.params;
    await deleteLabel(labelId);
    res.status(200).json({ message: 'Label deleted successfully' });
  } catch (error: any) {
    next(error);
  }
};

// --------------------------- GET LABEL BY ID ---------------------------
export const getLabelByIdHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { labelId } = req.params;
    const label = await getLabelById(labelId);

    if (!label) {
      res.status(404).json({ message: 'Label not found' });
      return;
    }

    res.status(200).json(label);
  } catch (error: any) {
    next(error);
  }
};

// --------------------------- GET LABELS BY BOARD ---------------------------
export const getLabelsByBoardHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { boardId } = req.params;

    if (!boardId || boardId === 'undefined') {
      res.status(400).json({ message: 'Invalid board ID' });
      return;
    }

    const labels = await getLabelsByBoard(boardId);

    res.status(200).json(labels);
  } catch (error: any) {
    console.error('Error fetching labels by board:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
