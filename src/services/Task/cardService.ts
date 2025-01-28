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
import { IPopulatedCard, ICreateCardInput } from '../../types/task';

interface UpdateGanttInput {
  startDate?: string;
  dueDate?: string;
  progress: number;
}

/**
 * Interface for Fetching Cards with Filters
 */
interface FetchCardsParams {
  boardId: string;
  search?: string;
  progress?: number;
  startDateFrom?: string;
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  skip: number;
  limit: number;
}

/**
 * Fetch Cards by Board ID with Filters and Pagination
 */
export const getCardsByBoardIdWithFilters = async (
  params: FetchCardsParams
): Promise<[ICard[], number]> => {
  const {
    boardId,
    search,
    progress,
    startDateFrom,
    startDateTo,
    dueDateFrom,
    dueDateTo,
    skip,
    limit,
  } = params;

  // Step 1: Fetch all List IDs associated with the Board
  const lists = await List.find({ board: boardId }).select('_id').exec();
  const listIds = lists.map(list => list._id);

  if (listIds.length === 0) {
    // No lists found for the board, hence no cards
    return [[], 0];
  }

  // Step 2: Build the query object
  const query: any = {
    list: { $in: listIds },
  };

  // Search by title
  if (search) {
    query.title = { $regex: search, $options: 'i' }; // Case-insensitive
  }

  // Filter by progress
  if (progress !== undefined && progress !== null) {
    query.progress = progress;
  }

  // Filter by start date range
  if (startDateFrom || startDateTo) {
    query.startDate = {};
    if (startDateFrom) {
      query.startDate.$gte = new Date(startDateFrom);
    }
    if (startDateTo) {
      query.startDate.$lte = new Date(startDateTo);
    }
  }

  // Filter by due date range
  if (dueDateFrom || dueDateTo) {
    query.dueDate = {};
    if (dueDateFrom) {
      query.dueDate.$gte = new Date(dueDateFrom);
    }
    if (dueDateTo) {
      query.dueDate.$lte = new Date(dueDateTo);
    }
  }

  // Execute the queries
  const [cards, total] = await Promise.all([
    Card.find(query)
      .populate('assignees', 'name email')
      .populate('labels', 'name color')
      .populate({
        path: 'list',
        select: 'name board',
        populate: {
          path: 'board',
          select: 'name description headers team',
        },
      })
      .populate('attachments', 'filename url')
      .skip(skip)
      .limit(limit)
      .exec(),
    Card.countDocuments(query).exec(),
  ]);

  return [cards, total];
};

/**
 * Function to fetch a populated card by ID
 */
export const getCardById = async (cardId: string): Promise<IPopulatedCard | null> => {
  return Card.findById(cardId)
    .populate('assignees', 'name email') // Populated IUser
    .populate('labels') // Populated ILabel[]
    .populate('attachments') // Populated IAttachment[]
    .populate({
      path: 'comments',
      populate: { path: 'author', select: 'name email' }, // Populated IUser in comments
    })
    .populate({
      path: 'list',
      populate: { path: 'board', select: 'name description headers team' }, // Populate IBoard through IList
    })
    .exec() as Promise<IPopulatedCard | null>;
};
/**
 * Checks if adding dependencies would create a circular dependency.
 * @param targetTaskId - The ID of the task being created or updated.
 * @param dependencies - The dependencies being added (array of task IDs).
 * @param session - Mongoose session for transactional safety.
 * @returns Promise<boolean> - True if a circular dependency is detected, else false.
 */
const hasCircularDependency = async (
  targetTaskId: string,
  dependencies: string[],
  session: mongoose.ClientSession
): Promise<boolean> => {
  const visited = new Set<string>();

  const visit = async (taskId: string): Promise<boolean> => {
    if (taskId === targetTaskId) {
      return true; // Cycle detected
    }
    if (visited.has(taskId)) {
      return false;
    }
    visited.add(taskId);
    const task = await Card.findById(taskId).session(session);
    if (!task || !task.dependencies) {
      return false;
    }
    for (const depId of task.dependencies) {
      if (await visit(depId)) {
        return true;
      }
    }
    return false;
  };

  for (const depId of dependencies) {
    if (await visit(depId)) {
      return true;
    }
  }

  return false;
};

/**
 * Create a new card with dependencies and circular dependency checks.
 */
export const createCard = async (input: ICreateCardInput, user: IUser): Promise<IPopulatedCard> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const list = await List.findById(input.list).session(session);
    if (!list) {
      throw new Error('List not found');
    }

    const cardsInList = await Card.find({ list: input.list }).session(session);
    const newPosition = cardsInList.length;

    // Pre-generate ObjectId for the new card
    const newCardId = new mongoose.Types.ObjectId();

    // Validate dependencies if any
    if (input.dependencies && input.dependencies.length > 0) {
      // Fetch all dependent cards
      const dependentCards = await Card.find({ _id: { $in: input.dependencies } }).session(session);
      if (dependentCards.length !== input.dependencies.length) {
        throw new Error('One or more dependencies do not exist');
      }

      // Check for circular dependencies
      const hasCycle = await hasCircularDependency(newCardId.toString(), input.dependencies, session);
      if (hasCycle) {
        throw new Error('Circular dependency detected');
      }
    }

    const card = new Card({
      _id: newCardId, // Assign the pre-generated ObjectId
      title: input.title,
      description: input.description,
      list: input.list,
      assignees: input.assignees || [],
      labels: input.labels || [],
      dueDate: input.dueDate,
      position: input.position !== undefined ? input.position : newPosition,
      status: input.status || list.name,
      priority: input.priority || 'Medium',
      startDate: input.startDate || null,
      dependencies: input.dependencies || [],
    });

    const savedCard = await card.save({ session });

    await List.findByIdAndUpdate(input.list, { $push: { cards: savedCard._id } }, { session });

    await Activity.create(
      [
        {
          board: list.board,
          list: input.list,
          card: savedCard._id,
          user: user._id,
          type: ActivityType.Created,
          details: `Card "${savedCard.title}" created.`,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Populate the card before returning
    const populatedCard = await getCardById(savedCard._id.toString());
    if (!populatedCard) {
      throw new Error('Failed to populate card');
    }

    return populatedCard;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Update Card
 */
interface UpdateCardInput {
  title?: string;
  description?: string;
  assignees?: mongoose.Types.ObjectId[];
  labels?: mongoose.Types.ObjectId[];
  startDate?: Date;
  dueDate?: Date;
  position?: number;
  progress?: number;
  status?: string;
  priority?: string;
  list?: mongoose.Types.ObjectId;
  dependencies?: string[]; // New Field
}



/**
 * Update ONLY Gantt fields: startDate, dueDate, progress.
 * This does NOT handle reordering, dependencies, etc.
 */
export const updateCardGanttFields = async (
  cardId: string,
  updates: UpdateGanttInput,
  user: IUser
) => {
  // 1) Find the card
  const card = await Card.findById(cardId);
  if (!card) {
    throw new Error('Card not found');
  }

  // 2) Optionally validate progress
  if (typeof updates.progress === 'number') {
    // Example rule: progress can’t decrease
    if (updates.progress < card.progress) {
      throw new Error('Progress cannot be decreased.');
    }
    card.progress = updates.progress;
  }

  // 3) Convert startDate/dueDate if provided
  if (updates.startDate) {
    const parsedStart = new Date(updates.startDate);
    if (isNaN(parsedStart.getTime())) {
      throw new Error('Invalid startDate format.');
    }
    card.startDate = parsedStart;
  }
  if (updates.dueDate) {
    const parsedDue = new Date(updates.dueDate);
    if (isNaN(parsedDue.getTime())) {
      throw new Error('Invalid dueDate format.');
    }
    card.dueDate = parsedDue;
  }

  // 4) Save the card
  const updatedCard = await card.save();

  // 5) Record Activity if you want
  const listDoc = await List.findById(updatedCard.list);
  await Activity.create({
    board: listDoc?.board,
    list: updatedCard.list,
    card: updatedCard._id,
    user: user._id,
    type: ActivityType.Updated,
    details: `Updated Gantt fields on card "${updatedCard.title}".`,
  });

  // 6) Re-populate if you want a fully populated result
  const populatedCard = await getCardById(updatedCard._id.toString());
  return populatedCard;
};
/**
 * Update an existing card with dependencies and circular dependency checks.
 * 
 * Returns a JSON object that includes `boardId` in case you want
 * the front end to see it easily.
 */
export const updateCard = async (
  cardId: string,
  updates: UpdateCardInput,
  user: IUser
): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) Find the card
    const card = await Card.findById(cardId).session(session);
    if (!card) {
      throw new Error('Card not found');
    }

    // 2) Handle dependencies if provided
    if (updates.dependencies) {
      // 2a) Check if all dependency IDs exist
      const dependentCards = await Card.find({
        _id: { $in: updates.dependencies },
      }).session(session);

      if (dependentCards.length !== updates.dependencies.length) {
        throw new Error('One or more dependencies do not exist');
      }

      // 2b) Check for circular dependencies
      const hasCycle = await hasCircularDependency(cardId, updates.dependencies, session);
      if (hasCycle) {
        throw new Error('Circular dependency detected');
      }
    }

    // 3) If the `list` field changed, fetch the new list to set `status`
    let newList: IList | null = null;
    if (updates.list) {
      newList = await List.findById(updates.list).session(session);
      if (newList) {
        // If no explicit status was provided, use the new list's name
        updates.status = updates.status || newList.name;
      }
    }

    // 4) Apply the updates to the card
    Object.assign(card, updates);
    const updatedCard = await card.save({ session });

    // 5) If position or list changed, reorder cards in the new list
    if (updates.position !== undefined || updates.list) {
      const destinationList =
        newList || (await List.findById(updatedCard.list).session(session));

      if (destinationList) {
        const cardsInList = await Card.find({ list: destinationList._id })
          .session(session)
          .sort('position');

        // Reassign positions in ascending order
        for (let i = 0; i < cardsInList.length; i++) {
          cardsInList[i].position = i;
          await cardsInList[i].save({ session });
        }
      }
    }

    // 6) Log Activity
    const listDoc = await List.findById(updatedCard.list).session(session);
    await Activity.create(
      [
        {
          board: listDoc?.board,
          list: updatedCard.list,
          card: updatedCard._id,
          user: user._id,
          type: ActivityType.Updated,
          details: `Card "${updatedCard.title}" updated.`,
        },
      ],
      { session }
    );

    // 7) Commit Transaction
    await session.commitTransaction();
    session.endSession();

    // 8) Populate the updated card so we can return a rich object
    const populatedCard = await getCardById(updatedCard._id.toString());
    if (!populatedCard) {
      throw new Error('Failed to populate card');
    }

    // 9) Find the boardId from the list
    //    Because `populatedCard.list` might be an object with `.board`
    let boardId: string | undefined = undefined;
    if (populatedCard.list && typeof populatedCard.list === 'object') {
      const boardOrId = (populatedCard.list as any).board;
      // `boardOrId` might be an object or an ObjectId
      if (boardOrId?._id) {
        boardId = boardOrId._id.toString();
      } else if (boardOrId) {
        boardId = boardOrId.toString();
      }
    }

    // Convert to plain JS object so we can attach "boardId"
    const resultObj = JSON.parse(JSON.stringify(populatedCard));
      resultObj.boardId = boardId; // attach the boardId if you have it
      return resultObj;


    // Return this object to the controller => front end sees { ...cardData, boardId: '...' }
    return resultObj;
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
export const getCardsByBoardId = async (boardId: string): Promise<ICard[]> => {
  return Card.find({ 'list.board': boardId }) // Ensure this filters through the list's board ID
    .populate('assignees', 'name email') // Populate assignees
    .populate({
      path: 'list',
      populate: { path: 'board', select: 'name description headers team' }, // Populate IBoard via IList
    })
    .populate('labels', 'name color') // Populate labels
    .populate('attachments', 'filename url') // Populate attachments
    .exec();
};

/**
 * Delete Card and return the boardId
 */
export const deleteCard = async (
  cardId: string,
  user: IUser
): Promise<string | null> => {
  const card = await Card.findById(cardId);
  if (!card) return null;

  // Capture the boardId from the card's list
  // We'll retrieve the list doc to find its board
  const listDoc = await List.findById(card.list);
  let boardId: string | null = null;
  if (listDoc?.board) {
    boardId = listDoc.board.toString(); 
  }

  // Remove card reference from list
  await List.findByIdAndUpdate(card.list, { $pull: { cards: card._id } });
  // Optionally, delete all comments and attachments
  await Comment.deleteMany({ card: card._id });
  await Card.findByIdAndDelete(cardId);

  // Log activity
  await Activity.create({
    board: listDoc?.board,
    list: card.list,
    card: card._id,
    user: user._id,
    type: ActivityType.Deleted,
    details: `Card "${card.title}" deleted.`,
  });

  return boardId; // Return the boardId (or null if not found)
};

/**
 * Assign User to Card and return the updated card's boardId, and record an Activity.
 *
 * @param cardId  The ID of the card
 * @param userId  The ID of the user to be assigned to the card
 * @param actor   The user performing the assignment (for activity logs)
 */
export const assignUserToCard = async (
  cardId: string,
  userId: string,
  actor: IUser
): Promise<{
  card: ICard | null;
  boardId: string | null;
}> => {
  // 1) Update the card's assignees (avoids duplicates via $addToSet)
  const updatedCard = await Card.findByIdAndUpdate(
    cardId,
    { $addToSet: { assignees: userId } },
    { new: true }
  );

  if (!updatedCard) {
    // If no card found, return null
    return { card: null, boardId: null };
  }

  // 2) Find the list doc to retrieve the board
  const listDoc = await List.findById(updatedCard.list);
  let boardId: string | null = null;
  if (listDoc?.board) {
    boardId = listDoc.board.toString();
  }

  // 3) Record Activity (the "actor" user performed the assignment)
  await Activity.create({
    board: listDoc?.board,     // The board’s ObjectId from the list
    list: updatedCard.list,    // The list’s ObjectId
    card: updatedCard._id,     // The card’s ObjectId
    user: actor._id,           // The user performing the assignment
    type: ActivityType.Updated,
    details: `Assigned user '${userId}' to card "${updatedCard.title}".`,
  });

  // 4) Return the updated card + boardId so the controller can respond with them
  return { card: updatedCard, boardId };
};

/**
 * Remove (unassign) a user from a card's assignees
 * and return the updated card + the boardId.
 *
 * @param cardId The ID of the card
 * @param userId The ID of the user being removed
 * @param actor  The user performing the unassignment (for Activity logs)
 */
export const unassignUserFromCard = async (
  cardId: string,
  userId: string,
  actor: IUser
): Promise<{
  card: ICard | null;
  boardId: string | null;
}> => {
  // 1) Update the card to remove the user from assignees
  const updatedCard = await Card.findByIdAndUpdate(
    cardId,
    { $pull: { assignees: userId } },  // <-- `$pull` to remove
    { new: true }
  );

  if (!updatedCard) {
    return { card: null, boardId: null };
  }

  // 2) Find the list doc to retrieve the board
  const listDoc = await List.findById(updatedCard.list);
  let boardId: string | null = null;
  if (listDoc?.board) {
    boardId = listDoc.board.toString();
  }

  // 3) Record an Activity: actor unassigned user from the card
  await Activity.create({
    board: listDoc?.board,
    list: updatedCard.list,
    card: updatedCard._id,
    user: actor._id,  // The user performing the action
    type: ActivityType.Updated,
    details: `Removed user '${userId}' from card "${updatedCard.title}".`,
  });

  return { card: updatedCard, boardId };
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


// src/services/cardService.ts

/**
 * Update a sub-task by subTaskId
 */
export const updateSubTaskById = async (
  cardId: string,
  subTaskId: string,
  updates: Partial<ISubTask>,
  user: IUser
): Promise<ICard | null> => {
  const card = await Card.findById(cardId);
  if (!card || !card.subTasks) {
    return null;
  }

  // Find the sub-task by "id"
  const subTask = card.subTasks.find((st) => st.id === subTaskId);
  if (!subTask) {
    return null;
  }

  // Apply updates
  Object.assign(subTask, updates);

  const updatedCard = await card.save();

  await Activity.create({
    board: (await List.findById(updatedCard.list))?.board,
    list: updatedCard.list,
    card: updatedCard._id,
    user: user._id,
    type: ActivityType.Updated,
    details: `Updated sub-task "${subTask.title}" on card "${updatedCard.title}".`,
  });

  return updatedCard;
};

/**
 * Delete a sub-task by subTaskId
 */
export const deleteSubTaskById = async (
  cardId: string,
  subTaskId: string,
  user: IUser
): Promise<ICard | null> => {
  const card = await Card.findById(cardId);
  if (!card || !card.subTasks) {
    return null;
  }

  // Find the index of the sub-task by "id"
  const subTaskIndex = card.subTasks.findIndex((st) => st.id === subTaskId);
  if (subTaskIndex === -1) {
    return null;
  }

  const removedSubTask = card.subTasks[subTaskIndex];
  card.subTasks.splice(subTaskIndex, 1);
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

/**
 * Fetch all cards by board ID
 */
export const getCardByBoardId = async (boardId: string): Promise<ICard[]> => {
  // Assuming the 'List' model has a 'board' field
  const lists = await List.find({ board: boardId }).select('_id').exec();
  const listIds = lists.map(list => list._id);

  if (listIds.length === 0) {
    return [];
  }

  return Card.find({ list: { $in: listIds } })
    .populate('assignees', 'name email')
    .populate('labels', 'name color')
    .populate('attachments', 'filename url')
    .exec();
};