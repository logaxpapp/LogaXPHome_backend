// src/services/Task/labelService.ts

import Label, { ILabel } from '../../models/Task/Label';
import mongoose from 'mongoose';

interface CreateLabelInput {
  name: string;
  color: string;
  board: mongoose.Types.ObjectId | string; // board ID
}

// --------------------------- CREATE LABEL ---------------------------
export const createLabel = async (input: CreateLabelInput): Promise<ILabel> => {
  const newLabel = new Label(input);
  return newLabel.save();
};

// --------------------------- DELETE LABEL ---------------------------
export const deleteLabel = async (labelId: string): Promise<void> => {
  await Label.findByIdAndDelete(labelId);
};

// --------------------------- GET LABEL BY ID ---------------------------
export const getLabelById = async (labelId: string): Promise<ILabel | null> => {
  if (!mongoose.Types.ObjectId.isValid(labelId)) {
    throw new Error('Invalid label ID');
  }

  const label = await Label.findById(labelId).exec();
  return label;
};

// --------------------------- GET LABELS BY BOARD ---------------------------
export const getLabelsByBoard = async (boardId: string): Promise<ILabel[]> => {
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    throw new Error('Invalid board ID');
  }
  
  const labels = await Label.find({ board: boardId }).exec();
  return labels;
};
