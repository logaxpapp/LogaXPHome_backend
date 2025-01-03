// src/services/cardService.ts

import mongoose from 'mongoose';
import Card, { ICard, ISubTask, ITimeLog, ICustomField } from '../../models/Task/Card';
import { ICustomFieldInput } from '../../types/task';
import { IList } from '../../models/Task/List';
import List from '../../models/Task/List';
import Comment from '../../models/Task/Comment';
import Activity, { ActivityType } from '../../models/Task/Activity';
import Label from '../../models/Task/Label';
import { IUser } from '../../models/User';

/**
 * Create a new Card
 */
interface CreateCardInput {
    title: string;
    description?: string;
    list: mongoose.Types.ObjectId;
    assignees?: mongoose.Types.ObjectId[];
    labels?: mongoose.Types.ObjectId[];
    dueDate?: Date;
    position?: number;
    status?: string; // New Field
    priority?: string; // New Field
  }
  
  export const createCard = async (input: CreateCardInput, user: IUser): Promise<ICard> => {
    // Fetch the list to get its name for status
    const list = await List.findById(input.list);
    if (!list) {
      throw new Error('List not found');
    }
  
    // Determine the position based on the current number of cards in the list
    const cardsInList = await Card.find({ list: input.list });
    const newPosition = cardsInList.length;
  
    const card = new Card({
      title: input.title,
      description: input.description,
      list: input.list,
      assignees: input.assignees || [],
      labels: input.labels || [],
      dueDate: input.dueDate,
      position: input.position !== undefined ? input.position : newPosition,
      status: input.status || list.name, // Set status based on list name if not provided
      priority: input.priority || 'Medium', // Handle default
    });
  
    const savedCard = await card.save();
  
    // Add card to list's cards array
    await List.findByIdAndUpdate(input.list, { $push: { cards: savedCard._id } });
  
    // Log activity
    await Activity.create({
      board: list.board,
      list: input.list,
      card: savedCard._id,
      user: user._id,
      type: ActivityType.Created,
      details: `Card "${savedCard.title}" created.`,
    });
  
    return savedCard;
  };
/**
 * Fetch a Card by ID with populates
 */
export const getCardById = async (cardId: string): Promise<ICard | null> => {
  return Card.findById(cardId)
    .populate('assignees', 'name email')
    .populate('labels') // Populates labels as ILabel[]
    .populate('attachments')
    .populate({
      path: 'comments',
      populate: { path: 'author', select: 'name email' },
    })
    .populate('board') // Populate the board to get boardId
    .exec();
};

  
  export const getCardsByBoardId = async (boardId: string): Promise<ICard[]> => {
    return Card.find({ board: boardId })
      .populate('assignees', 'name email') // Populate assignees
      .populate('list', 'name') // Optionally populate the list
      .populate('labels', 'name color'); // Populate additional fields if needed
  };
  

/**
 * Update Card
 */
interface UpdateCardInput {
    title?: string;
    description?: string;
    assignees?: mongoose.Types.ObjectId[];
    labels?: mongoose.Types.ObjectId[];
    dueDate?: Date;
    position?: number;
    status?: string; // New Field
    priority?: string; // New Field
    list?: mongoose.Types.ObjectId; // New Field
  }
  

  export const updateCard = async (
    cardId: string,
    updates: UpdateCardInput,
    user: IUser
  ): Promise<ICard | null> => {
    const card = await Card.findById(cardId);
    if (!card) return null;
  
    let newList: IList | null = null;
  
    // If the list is being updated, fetch the new list to get its name
    if (updates.list) {
      newList = await List.findById(updates.list);
      if (newList) {
        updates.status = updates.status || newList.name; // Set status based on new list's name if not provided
      }
    }
  
    // Update the card
    Object.assign(card, updates);
    const updatedCard = await card.save();
  
    // If position was updated, reorder other cards in the destination list
    if (updates.position !== undefined) {
      const destinationList = newList || (await List.findById(updatedCard.list));
      if (destinationList) {
        const cardsInList = await Card.find({ list: destinationList._id }).sort('position');
  
        // Reorder positions
        for (let i = 0; i < cardsInList.length; i++) {
          cardsInList[i].position = i;
          await cardsInList[i].save();
        }
      }
    }
  
    // Log activity
    await Activity.create({
      board: (await List.findById(updatedCard.list))?.board,
      list: updatedCard.list,
      card: updatedCard._id,
      user: user._id,
      type: ActivityType.Updated,
      details: `Card "${updatedCard.title}" updated.`,
    });
  
    return updatedCard;
  };
/**
 * Delete Card
 */
export const deleteCard = async (cardId: string, user: IUser): Promise<void> => {
  const card = await Card.findById(cardId);
  if (card) {
    // Remove card reference from list
    await List.findByIdAndUpdate(card.list, { $pull: { cards: card._id } });
    // Optionally, delete all comments and attachments
    await Comment.deleteMany({ card: card._id });
    await Card.findByIdAndDelete(cardId);

    // Log activity
    await Activity.create({
      board: (await List.findById(card.list))?.board,
      list: card.list,
      card: card._id,
      user: user._id,
      type: ActivityType.Deleted,
      details: `Card "${card.title}" deleted.`,
    });
  }
};

/**
 * Assign User to Card
 */
export const assignUserToCard = async (
  cardId: string,
  userId: string
): Promise<ICard | null> => {
  // $addToSet -> avoids duplicates
  return Card.findByIdAndUpdate(
    cardId,
    { $addToSet: { assignees: userId } },
    { new: true }
  );
};

/* ------------------------------------------------------------------
   SUB-TASK OPERATIONS
------------------------------------------------------------------ */

/**
 * Add a Sub-Task
 */
export const addSubTask = async (
  cardId: string,
  subTask: ISubTask,
  user: IUser
): Promise<ICard | null> => {
  const updatedCard = await Card.findByIdAndUpdate(
    cardId,
    { $push: { subTasks: subTask } },
    { new: true }
  );

  if (updatedCard) {
    await Activity.create({
      board: (await List.findById(updatedCard.list))?.board,
      list: updatedCard.list,
      card: updatedCard._id,
      user: user._id,
      type: ActivityType.Updated,
      details: `Added a sub-task "${subTask.title}" to card "${updatedCard.title}".`,
    });
  }

  return updatedCard;
};

/**
 * Update a Sub-Task (by index)
 */
export const updateSubTask = async (
  cardId: string,
  subtaskIndex: number,
  updates: Partial<ISubTask>,
  user: IUser
): Promise<ICard | null> => {
  const card = await Card.findById(cardId);
  if (!card || !card.subTasks || subtaskIndex < 0 || subtaskIndex >= card.subTasks.length) {
    return null;
  }

  // Merge updates into the existing sub-task
  Object.assign(card.subTasks[subtaskIndex], updates);
  const updatedCard = await card.save();

  await Activity.create({
    board: (await List.findById(updatedCard.list))?.board,
    list: updatedCard.list,
    card: updatedCard._id,
    user: user._id,
    type: ActivityType.Updated,
    details: `Updated sub-task "${card.subTasks[subtaskIndex].title}" on card "${updatedCard.title}".`,
  });

  return updatedCard;
};

/**
 * Delete a Sub-Task (by index)
 */
export const deleteSubTask = async (
  cardId: string,
  subtaskIndex: number,
  user: IUser
): Promise<ICard | null> => {
  const card = await Card.findById(cardId);
  if (!card || !card.subTasks || subtaskIndex < 0 || subtaskIndex >= card.subTasks.length) {
    return null;
  }

  const removedSubTask = card.subTasks[subtaskIndex];
  card.subTasks.splice(subtaskIndex, 1);
  const updatedCard = await card.save();

  await Activity.create({
    board: (await List.findById(updatedCard.list))?.board,
    list: updatedCard.list,
    card: updatedCard._id,
    user: user._id,
    type: ActivityType.Updated,
    details: `Deleted sub-task "${removedSubTask.title}" from card "${updatedCard.title}".`,
  });

  return updatedCard;
};

/* ------------------------------------------------------------------
   TIME LOG OPERATIONS
------------------------------------------------------------------ */

export const logTime = async (
    cardId: string,
    userId: string,  // userId is a plain string from the request body
    start: Date,
    end: Date
  ) => {
    // 1. Convert string userId to a real ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
  
    // 2. Calculate duration
    const duration = (end.getTime() - start.getTime()) / 1000 / 60; // e.g. minutes
  
    // 3. Update the card with a new timeLogs entry
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      {
        $push: {
          timeLogs: {
            user: userObjectId,
            start,
            end,
            duration,
          },
        },
      },
      { new: true }
    );
  
    // 4. Optionally log an activity (if updatedCard exists)
    if (updatedCard) {
      await Activity.create({
        board: (await List.findById(updatedCard.list))?.board,
        list: updatedCard.list,
        card: updatedCard._id,
        user: userObjectId, // We can pass the ObjectId directly
        type: ActivityType.Updated,
        details: `Logged ${duration} minutes to card "${updatedCard.title}".`,
      });
    }
  
    // 5. Return the updated card
    return updatedCard;
  };

/* ------------------------------------------------------------------
   CUSTOM FIELD OPERATIONS
------------------------------------------------------------------ */

/**
 * Add a Custom Field
 */
export const addCustomField = async (
  cardId: string,
  customField: ICustomFieldInput,
  user: IUser
): Promise<ICard | null> => {
  const updatedCard = await Card.findByIdAndUpdate(
    cardId,
    { $push: { customFields: customField } }, // Mongoose adds 'id'
    { new: true }
  );

  if (updatedCard) {
    await Activity.create({
      board: (await List.findById(updatedCard.list))?.board,
      list: updatedCard.list,
      card: updatedCard._id,
      user: user._id,
      type: ActivityType.Updated,
      details: `Added custom field "${customField.key}" to card "${updatedCard.title}".`,
    });
  }

  return updatedCard;
};


/**
 * Update a Custom Field by index
 */
export const updateCustomField = async (
  cardId: string,
  fieldIndex: number,
  updates: Partial<ICustomField>,
  user: IUser
): Promise<ICard | null> => {
  const card = await Card.findById(cardId);
  if (!card || !card.customFields || fieldIndex < 0 || fieldIndex >= card.customFields.length) {
    return null;
  }

  Object.assign(card.customFields[fieldIndex], updates);
  const updatedCard = await card.save();

  await Activity.create({
    board: (await List.findById(updatedCard.list))?.board,
    list: updatedCard.list,
    card: updatedCard._id,
    user: user._id,
    type: ActivityType.Updated,
    details: `Updated custom field on card "${updatedCard.title}".`,
  });

  return updatedCard;
};

/**
 * Delete a Custom Field by index
 */
export const deleteCustomField = async (
  cardId: string,
  fieldIndex: number,
  user: IUser
): Promise<ICard | null> => {
  const card = await Card.findById(cardId);
  if (!card || !card.customFields || fieldIndex < 0 || fieldIndex >= card.customFields.length) {
    return null;
  }

  const removedField = card.customFields[fieldIndex];
  card.customFields.splice(fieldIndex, 1);
  const updatedCard = await card.save();

  await Activity.create({
    board: (await List.findById(updatedCard.list))?.board,
    list: updatedCard.list,
    card: updatedCard._id,
    user: user._id,
    type: ActivityType.Updated,
    details: `Deleted custom field "${removedField.key}" from card "${updatedCard.title}".`,
  });

  return updatedCard;
};



/* -----------------------------------------------------------
    LIKE & WATCHER SERVICE 
----------------------------------------------------------- */

/**
 * Like a Card
 */
export const likeCard = async (
    cardId: string,
    userId: string,
    user: IUser
  ): Promise<ICard | null> => {
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { $addToSet: { likes: userId } },
      { new: true }
    );
  
    if (updatedCard) {
      await Activity.create({
        board: (await List.findById(updatedCard.list))?.board,
        list: updatedCard.list,
        card: updatedCard._id,
        user: user._id,
        type: ActivityType.Updated,
        details: `User "${user.username}" liked the card "${updatedCard.title}".`,
      });
    }
  
    return updatedCard;
  };
  
  /**
   * Unlike a Card
   */
  export const unlikeCard = async (
    cardId: string,
    userId: string,
    user: IUser
  ): Promise<ICard | null> => {
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { $pull: { likes: userId } },
      { new: true }
    );
  
    if (updatedCard) {
      await Activity.create({
        board: (await List.findById(updatedCard.list))?.board,
        list: updatedCard.list,
        card: updatedCard._id,
        user: user._id,
        type: ActivityType.Updated,
        details: `User "${user.username}" unliked the card "${updatedCard.title}".`,
      });
    }
  
    return updatedCard;
  };
  
  /**
   * Add Watcher to Card
   */
  export const addWatcherToCard = async (
    cardId: string,
    userId: string,
    user: IUser
  ): Promise<ICard | null> => {
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { $addToSet: { watchers: userId } },
      { new: true }
    );
  
    if (updatedCard) {
      await Activity.create({
        board: (await List.findById(updatedCard.list))?.board,
        list: updatedCard.list,
        card: updatedCard._id,
        user: user._id,
        type: ActivityType.Updated,
        details: `User "${user.username}" started watching the card "${updatedCard.title}".`,
      });
    }
  
    return updatedCard;
  };
  
  /**
   * Remove Watcher from Card
   */
  export const removeWatcherFromCard = async (
    cardId: string,
    userId: string,
    user: IUser
  ): Promise<ICard | null> => {
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { $pull: { watchers: userId } },
      { new: true }
    );
  
    if (updatedCard) {
      await Activity.create({
        board: (await List.findById(updatedCard.list))?.board,
        list: updatedCard.list,
        card: updatedCard._id,
        user: user._id,
        type: ActivityType.Updated,
        details: `User "${user.username}" stopped watching the card "${updatedCard.title}".`,
      });
    }
  
    return updatedCard;
  };
  

  /**
 * Fetch Sub-Task by ID
 */
export const getSubTaskById = async (
  cardId: string,
  subTaskId: string
): Promise<ISubTask | null> => {
  const card = await Card.findById(cardId).select('subTasks');
  if (!card || !card.subTasks) return null;

  const subTask = card.subTasks.find((st) => st.id === subTaskId);
  return subTask || null;
};

/**
 * Fetch Time Log by ID
 */
export const getTimeLogById = async (
  cardId: string,
  timeLogId: string
): Promise<ITimeLog | null> => {
  const card = await Card.findById(cardId).select('timeLogs');
  if (!card || !card.timeLogs) return null;

  const timeLog = card.timeLogs.find((tl) => tl.id === timeLogId);
  return timeLog || null;
};

/**
 * Fetch Custom Field by ID
 */
export const getCustomFieldById = async (
  cardId: string,
  customFieldId: string
): Promise<ICustomField | null> => {
  const card = await Card.findById(cardId).select('customFields');
  if (!card || !card.customFields) return null;

  const customField = card.customFields.find((cf) => cf.id === customFieldId);
  return customField || null;
};
//  src\services\Task\cardService.ts
/**
 * Add Label to Card
 */
export const addLabelToCard = async (
  cardId: string,
  labelId: string,
  user: IUser
): Promise<ICard | null> => {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(cardId) || !mongoose.Types.ObjectId.isValid(labelId)) {
    throw new Error('Invalid card ID or label ID');
  }

  // Ensure label exists
  const label = await Label.findById(labelId);
  if (!label) {
    throw new Error('Label not found');
  }

  const updatedCard = await Card.findByIdAndUpdate(
    cardId,
    { $addToSet: { labels: labelId } },
    { new: true }
  )
    .populate('labels') // Populate labels with ILabel objects
    .exec();

  if (updatedCard) {
    await Activity.create({
      board: (await List.findById(updatedCard.list))?.board,
      list: updatedCard.list,
      card: updatedCard._id,
      user: user._id,
      type: ActivityType.Updated,
      details: `Added label "${label.name}" to card "${updatedCard.title}".`,
    });
  }

  return updatedCard;
};

/**
 * Remove Label from Card
 */
export const removeLabelFromCard = async (
  cardId: string,
  labelId: string,
  user: IUser
): Promise<ICard | null> => {
  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(cardId) || !mongoose.Types.ObjectId.isValid(labelId)) {
    throw new Error('Invalid card ID or label ID');
  }

  const updatedCard = await Card.findByIdAndUpdate(
    cardId,
    { $pull: { labels: labelId } },
    { new: true }
  )
    .populate('labels') // Populate labels with ILabel objects
    .exec();

  if (updatedCard) {
    await Activity.create({
      board: (await List.findById(updatedCard.list))?.board,
      list: updatedCard.list,
      card: updatedCard._id,
      user: user._id,
      type: ActivityType.Updated,
      details: `Removed label "${labelId}" from card "${updatedCard.title}".`,
    });
  }

  return updatedCard;
};