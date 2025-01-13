// src/services/Task/labelService.ts

import Label, { ILabel } from '../../models/Task/Label';
import mongoose from 'mongoose';
import Board from '../../models/Task/Board';
import Card from '../../models/Task/Card';
import Activity, { ActivityType, IActivity } from '../../models/Task/Activity';

interface CreateLabelInput {
  name: string;
  color: string;
  board: mongoose.Types.ObjectId; // Ensure board is always an ObjectId
}

interface DeleteLabelInput {
  labelId: string;
  userId: mongoose.Types.ObjectId; // ID of the user performing the action
}

interface UpdateLabelInput {
  labelId: string;
  update: Partial<Pick<ILabel, 'name' | 'color'>>;
  userId: mongoose.Types.ObjectId;
}

// --------------------------- CREATE LABEL ---------------------------
export const createLabel = async (
  input: CreateLabelInput,
  userId: mongoose.Types.ObjectId
): Promise<ILabel> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newLabel = new Label({
      name: input.name,
      color: input.color,
      board: input.board,
    });
    const savedLabel = await newLabel.save({ session });

    // Update the Board's labels array
    await Board.findByIdAndUpdate(
      input.board,
      { $push: { labels: savedLabel._id } },
      { session }
    );

    // Log Activity
    const activity: Partial<IActivity> = {
      board: input.board,
      user: userId,
      type: ActivityType.Created,
      details: `Label "${savedLabel.name}" created.`,
    };

    await Activity.create([activity], { session });

    await session.commitTransaction();
    session.endSession();

    return savedLabel;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// --------------------------- DELETE LABEL ---------------------------
export const deleteLabel = async (
  input: DeleteLabelInput
): Promise<void> => {
  const { labelId, userId } = input;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate label ID
    if (!mongoose.isValidObjectId(labelId)) {
      throw new Error('Invalid label ID');
    }

    // Find the label to get the associated board
    const label = await Label.findById(labelId).session(session);
    if (!label) {
      throw new Error('Label not found');
    }

    const boardId = label.board;

    // Delete the label
    await Label.findByIdAndDelete(labelId).session(session);

    // Remove the label from the Board's labels array
    await Board.findByIdAndUpdate(
      boardId,
      { $pull: { labels: labelId } },
      { session }
    );

    // Remove the label from all Cards' labels arrays
    await Card.updateMany(
      { labels: labelId },
      { $pull: { labels: labelId } },
      { session }
    );

    // Log Activity
    const activity: Partial<IActivity> = {
      board: boardId,
      user: userId,
      type: ActivityType.Deleted,
      details: `Label "${label.name}" deleted.`,
    };

    await Activity.create([activity], { session });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// --------------------------- UPDATE LABEL ---------------------------
export const updateLabel = async (
  input: UpdateLabelInput
): Promise<ILabel | null> => {
  const { labelId, update, userId } = input;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate label ID
    if (!mongoose.isValidObjectId(labelId)) {
      throw new Error('Invalid label ID');
    }

    // Find the label to ensure it exists and get the boardId
    const label = await Label.findById(labelId).session(session);
    if (!label) {
      throw new Error('Label not found');
    }

    const updatedLabel = await Label.findByIdAndUpdate(
      labelId,
      update,
      { new: true, session }
    ).exec();

    if (!updatedLabel) {
      throw new Error('Failed to update label');
    }

    // Log Activity
    const activity: Partial<IActivity> = {
      board: label.board,
      user: userId,
      type: ActivityType.Updated,
      details: `Label "${updatedLabel.name}" updated.`,
    };

    await Activity.create([activity], { session });

    await session.commitTransaction();
    session.endSession();

    return updatedLabel;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// --------------------------- GET LABEL BY ID ---------------------------
export const getLabelById = async (labelId: string): Promise<ILabel | null> => {
  if (!mongoose.isValidObjectId(labelId)) {
    throw new Error('Invalid label ID');
  }

  const label = await Label.findById(labelId).exec();
  return label;
};

// --------------------------- GET LABELS BY BOARD ---------------------------
export const getLabelsByBoard = async (boardId: string): Promise<ILabel[]> => {
  if (!mongoose.isValidObjectId(boardId)) {
    throw new Error('Invalid board ID');
  }

  const labels = await Label.find({ board: boardId }).exec();
  return labels;
};
