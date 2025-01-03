// src/services/listService.ts

import List, { IList } from '../../models/Task/List';
import Board, { IBoard } from '../../models/Task/Board';
import Card from '../../models/Task/Card';
import mongoose from 'mongoose';

interface CreateListInput {
  name: string;
  board: mongoose.Types.ObjectId;
  position?: number;
}

interface UpdateListInput {
  name?: string;
  position?: number;
}

export const createList = async (input: CreateListInput): Promise<IList> => {
  const list = new List({
    name: input.name,
    board: input.board,
    position: input.position || 0,
  });

  const savedList = await list.save();

  // Add list to board's lists array
  await Board.findByIdAndUpdate(input.board, { $push: { lists: savedList._id } });

  return savedList;
};
/**
 * Fetch a List by ID with populated cards and their related data
 */
export const getListById = async (listId: string): Promise<IList | null> => {
  // Validate the ObjectId to prevent unnecessary database queries
  if (!mongoose.Types.ObjectId.isValid(listId)) {
    throw new Error('Invalid list ID');
  }

  return List.findById(listId)
    .populate({
      path: 'cards', // Populate the 'cards' field in the List model
      populate: [
        // 1) Populate 'assignees' field in Card
        { path: 'assignees', select: 'username email' },
        // 2) Populate 'labels' field in Card
        { path: 'labels', select: 'name color' },
        // 3) Populate 'attachments' field in Card
        { path: 'attachments', select: 'filename url uploader' },
        // 4) Populate 'comments' field in Card and further populate nested fields
        {
          path: 'comments',
          populate: [
            { path: 'author', select: 'username email' },
            { path: 'likes', select: 'username email' },
            { path: 'mentions', select: 'username email' },
          ],
        },
        // 5) Populate 'watchers' field in Card
        { path: 'watchers', select: 'username email' },
        // 6) Populate 'likes' field in Card
        { path: 'likes', select: 'username email' },
        // 7) Populate 'assignee' field in each SubTask
        {
          path: 'subTasks.assignee',
          model: 'User', // Specify the referenced model
          select: 'username email',
        },
        // 8) Populate 'user' field in each TimeLog
        {
          path: 'timeLogs.user',
          model: 'User',
          select: 'username email',
        },
      ],
    })
    .exec();
};

export const updateList = async (
  listId: string,
  updates: UpdateListInput
): Promise<IList | null> => {
  return await List.findByIdAndUpdate(listId, updates, { new: true });
};

export const deleteList = async (listId: string): Promise<void> => {
  const list = await List.findById(listId);
  if (list) {
    // Remove list reference from board
    await Board.findByIdAndUpdate(list.board, { $pull: { lists: list._id } });
    // Optionally, delete all cards within the list
    await Card.deleteMany({ list: list._id });
    await List.findByIdAndDelete(listId);
  }
};
