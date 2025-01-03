import mongoose, { SortOrder } from 'mongoose';
import Activity, { IActivity } from '../../models/Task/Activity';

interface CreateActivityInput {
  board?: string;
  list?: string;
  card?: string;
  user: string;
  type: string;    // 'Created', 'Updated', etc.
  details: string;
}

/**
 * 1) CREATE Activity
 */
export const createActivity = async (input: CreateActivityInput): Promise<IActivity> => {
  const doc: Partial<IActivity> = {};

  if (input.board && mongoose.Types.ObjectId.isValid(input.board)) {
    doc.board = new mongoose.Types.ObjectId(input.board);
  }
  if (input.list && mongoose.Types.ObjectId.isValid(input.list)) {
    doc.list = new mongoose.Types.ObjectId(input.list);
  }
  if (input.card && mongoose.Types.ObjectId.isValid(input.card)) {
    doc.card = new mongoose.Types.ObjectId(input.card);
  }

  if (!mongoose.Types.ObjectId.isValid(input.user)) {
    throw new Error('Invalid userId.');
  }
  doc.user = new mongoose.Types.ObjectId(input.user);
  doc.type = input.type as any;
  doc.details = input.details;

  const activity = new Activity(doc);
  return activity.save();
};

/**
 * 2) GET Activities (all or filter by boardId, listId, cardId)
 *    Also supports optional pagination.
 */
export const getActivities = async (
  boardId?: string,
  listId?: string,
  cardId?: string,
  page?: number,
  limit?: number
): Promise<IActivity[]> => {
  const query: Record<string, any> = {};

  if (boardId && mongoose.Types.ObjectId.isValid(boardId)) {
    query.board = boardId;
  }
  if (listId && mongoose.Types.ObjectId.isValid(listId)) {
    query.list = listId;
  }
  if (cardId && mongoose.Types.ObjectId.isValid(cardId)) {
    query.card = cardId;
  }

  // Sorting by newest
  const sort: Record<string, SortOrder> = { createdAt: -1 };

  // Simple pagination
  const skip = page && limit ? (page - 1) * limit : 0;
  const perPage = limit ?? 0; // 0 => no limit

  return Activity.find(query)
    .sort(sort)
    .skip(skip)
    .limit(perPage)
    .populate('user', 'username email');
};

/**
 * 3) GET Single Activity By ID
 */
export const getActivityById = async (id: string): Promise<IActivity | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Activity.findById(id).populate('user', 'username email');
};

/**
 * 4) DELETE an Activity
 */
export const deleteActivity = async (activityId: string): Promise<IActivity | null> => {
  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    return null;
  }
  return Activity.findByIdAndDelete(activityId);
};
