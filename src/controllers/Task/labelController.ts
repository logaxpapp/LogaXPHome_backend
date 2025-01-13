// src/controllers/Task/labelController.ts

import { Request, Response, NextFunction } from 'express';
import {
  createLabel,
  deleteLabel,
  getLabelById,
  getLabelsByBoard,
  updateLabel,
} from '../../services/Task/labelService';
import { IUser } from '../../models/User';
import { ILabel } from '../../models/Task/Label';
import mongoose from 'mongoose';
import { ILabelResponse } from '../../types/task';

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

    // Ensure the user is authenticated
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    // Validate required fields
    if (!name || !color || !boardId) {
      res.status(400).json({ message: 'Name, color, and boardId are required.' });
      return;
    }

    // Validate and convert boardId to ObjectId
    if (!mongoose.isValidObjectId(boardId)) {
      res.status(400).json({ message: 'Invalid boardId.' });
      return;
    }
    const boardObjectId = new mongoose.Types.ObjectId(boardId);

    const label = await createLabel(
      { name, color, board: boardObjectId },
      new mongoose.Types.ObjectId(req.user._id)
    );

    // Map the label to include 'boardId' for the frontend
    const responseLabel: ILabelResponse = {
      _id: label._id.toString(),
      name: label.name,
      color: label.color,
      boardId: label.board.toString(),
      createdAt: label.createdAt.toISOString(),
      updatedAt: label.updatedAt.toISOString(),
    };

    res.status(201).json(responseLabel);
  } catch (error: any) {
    console.error('Error creating label:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
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

    // Ensure the user is authenticated
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    // Validate labelId
    if (!labelId || !mongoose.Types.ObjectId.isValid(labelId)) {
      res.status(400).json({ message: 'Invalid labelId.' });
      return;
    }

    await deleteLabel({ labelId, userId: new mongoose.Types.ObjectId(req.user._id) });
    res.status(200).json({ message: 'Label deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting label:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// --------------------------- UPDATE LABEL ---------------------------
export const updateLabelHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body;

    // Ensure the user is authenticated
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    // Validate labelId
    if (!labelId || !mongoose.Types.ObjectId.isValid(labelId)) {
      res.status(400).json({ message: 'Invalid labelId.' });
      return;
    }

    // Validate input data
    if (!name && !color) {
      res.status(400).json({ message: 'At least one of name or color must be provided.' });
      return;
    }

    const updateData: Partial<Pick<ILabel, 'name' | 'color'>> = {};
    if (name) updateData.name = name;
    if (color) updateData.color = color;

    const updatedLabel = await updateLabel({
      labelId: labelId,
      update: updateData,
      userId: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!updatedLabel) {
      res.status(404).json({ message: 'Label not found.' });
      return;
    }

    // Map the label to include 'boardId' for the frontend
    const responseLabel: ILabelResponse = {
      _id: updatedLabel._id.toString(),
      name: updatedLabel.name,
      color: updatedLabel.color,
      boardId: updatedLabel.board.toString(),
      createdAt: updatedLabel.createdAt.toISOString(),
      updatedAt: updatedLabel.updatedAt.toISOString(),
    };

    res.status(200).json(responseLabel);
  } catch (error: any) {
    console.error('Error updating label:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
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

    // Validate labelId
    if (!labelId || !mongoose.Types.ObjectId.isValid(labelId)) {
      res.status(400).json({ message: 'Invalid labelId.' });
      return;
    }

    const label = await getLabelById(labelId);

    if (!label) {
      res.status(404).json({ message: 'Label not found.' });
      return;
    }

    // Map the label to include 'boardId' for the frontend
    const responseLabel: ILabelResponse = {
      _id: label._id.toString(),
      name: label.name,
      color: label.color,
      boardId: label.board.toString(),
      createdAt: label.createdAt.toISOString(),
      updatedAt: label.updatedAt.toISOString(),
    };

    res.status(200).json(responseLabel);
  } catch (error: any) {
    console.error('Error fetching label by ID:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// --------------------------- GET LABELS BY BOARD ---------------------------
export const getLabelsByBoardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { boardId } = req.params;

    // Validate boardId
    if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
      res.status(400).json({ message: 'Invalid boardId.' });
      return;
    }

    const labels = await getLabelsByBoard(boardId);

    // Map labels to include 'boardId' for the frontend
    const responseLabels: ILabelResponse[] = labels.map((label) => ({
      _id: label._id.toString(),
      name: label.name,
      color: label.color,
      boardId: label.board.toString(),
      createdAt: label.createdAt.toISOString(),
      updatedAt: label.updatedAt.toISOString(),
    }));

    res.status(200).json(responseLabels);
  } catch (error: any) {
    console.error('Error fetching labels by board:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
