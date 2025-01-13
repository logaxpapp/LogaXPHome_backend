// src/controllers/cardController.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import {
  createCard,
  getCardById,
  updateCard,
  deleteCard,
  assignUserToCard,
  addSubTask,
  updateSubTaskById,
  deleteSubTaskById,
  logTime,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  likeCard,
  unlikeCard,
  addWatcherToCard,
  removeWatcherFromCard,
  getSubTaskById,
  getTimeLogById,
  getCustomFieldById,
  addLabelToCard,
  removeLabelFromCard,
  getCardsByBoardIdWithFilters,
  getCardByBoardId,
  unassignUserFromCard

} from '../../services/Task/cardService';
import { getBoardById } from '../../services/Task/boardService';
import { IUser } from '../../models/User';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/* -----------------------------------------------------------
   Standard CRUD
----------------------------------------------------------- */

/**
 * Create a new Card
 */
export const createCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, list, assignees, labels, dueDate, position, dependencies } = req.body;
    const card = await createCard(
      {
        title,
        description,
        list,
        assignees,
        labels,
        dueDate,
        position,
        dependencies, // Now included
      },
      req.user!
    );

    const populatedCard = await getCardById(card._id.toString()); // Ensure _id is a string
    res.status(201).json(populatedCard); // Return populated card
  } catch (error: any) {
    if (error.message.includes('Circular dependency')) {
      res.status(400).json({ message: error.message });
    } else {
      next(error);
    }
  }
};


  

/**
 * Get Card by ID
 */
export const getCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const card = await getCardById(cardId);

    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    res.status(200).json(card);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update Card
 */
export const updateCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const updates = req.body;

    const updatedCard = await updateCard(cardId, updates, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    if (error.message.includes('circular dependency')) {
      res.status(400).json({ message: error.message });
    } else {
      next(error);
    }
  }
};


/**
 * Delete Card
 */
export const deleteCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const boardId = await deleteCard(cardId, req.user!);
    if (boardId === null) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    // Return both message and boardId
    res.status(200).json({
      message: 'Card deleted successfully',
      boardId, 
    });
  } catch (error: any) {
    next(error);
  }
};


interface UpdateCardInput {
  title?: string;
  description?: string;
  startDate?: Date;       // <--- new
  dueDate?: Date;
  progress?: number;      // <--- new
  position?: number;
  status?: string;
  priority?: string;
  list?: mongoose.Types.ObjectId;
  assignees?: mongoose.Types.ObjectId[];
}



/**
 * Update a card's Gantt fields (startDate, dueDate, progress) via a route handler.
 */
export const updateCardGanttHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { startDate, dueDate, progress } = req.body;

    // Fetch existing card to compare progress
    const existingCard = await getCardById(cardId);
    if (!existingCard) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    // Validate progress
    if (progress !== undefined) {
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        res.status(400).json({ message: 'Invalid progress value.' });
        return;
      }

      // Example Business Rule: Prevent decreasing progress
      if (progress < existingCard.progress) {
        res.status(400).json({ message: 'Progress cannot be decreased.' });
        return;
      }
    }

    // Validate startDate & dueDate if necessary
    if (startDate && isNaN(Date.parse(startDate))) {
      res.status(400).json({ message: 'Invalid startDate format.' });
      return;
    }
    if (dueDate && isNaN(Date.parse(dueDate))) {
      res.status(400).json({ message: 'Invalid dueDate format.' });
      return;
    }

    // Build your updates object
    const updates: UpdateCardInput = {};
    if (startDate) updates.startDate = new Date(startDate);
    if (dueDate) updates.dueDate = new Date(dueDate);
    if (progress !== undefined) updates.progress = progress;

    // Call your service function
    const updatedCard = await updateCard(cardId, updates, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card not found after update.' });
      return;
    }

    // **Return the updatedCard in the response** so the front end can see boardId, etc.
    res.status(200).json(updatedCard);
  } catch (err) {
    next(err);
  }
};


/**
 * Assign User to Card
 */
export const assignUserToCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { userId } = req.body;

    // The user performing the action (actor)
    const actor = req.user as IUser;

    // Call our service function
    const { card, boardId } = await assignUserToCard(cardId, userId, actor);

    if (!card) {
      res.status(404).json({ message: 'Card not found' });
    return;
    }

    // Return boardId so the front end can re-fetch the board if needed
     res.status(200).json({
      message: 'User assigned to card successfully',
      boardId,
    });
    return;
  } catch (error: any) {
    next(error);
  }
};


/**
 * @route   DELETE /api/cards/:cardId/unassign
 * @desc    Remove (unassign) a user from a card
 * @access  Private
 */
export const unassignUserFromCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { userId } = req.body;

    // The user performing the action (actor)
    const actor = req.user as IUser;

    // Call the service function
    const { card, boardId } = await unassignUserFromCard(cardId, userId, actor);

    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    // Return boardId so the front end can re-fetch the board if needed
    res.status(200).json({
      message: 'User removed from card successfully',
      boardId,
    });
    return;
  } catch (error: any) {
    next(error);
  }
};

/* -----------------------------------------------------------
   SUB-TASK ENDPOINTS
----------------------------------------------------------- */

/**
 * Add Sub-Task
 */
export const addSubTaskHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { title, dueDate, assignee } = req.body;

    const updatedCard = await addSubTask(
      cardId,
      { title, completed: false, dueDate, assignee }, // 'id' will be generated
      req.user!
    );

    if (!updatedCard) {
      res.status(404).json({ message: 'Card not found or error adding sub-task' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};
/**
 * Update sub-task by subTaskId
 */
export const updateSubTaskHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, subTaskId } = req.params;
    const updates = req.body; // e.g. { title: "New Title", completed: true }

    const updatedCard = await updateSubTaskById(cardId, subTaskId, updates, req.user!);
    if (!updatedCard) {
      res.status(404).json({ message: 'Card or sub-task not found' });
      return;
    }

    res.status(200).json(updatedCard);
    return;
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete sub-task by subTaskId
 */
export const deleteSubTaskHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, subTaskId } = req.params;

    const updatedCard = await deleteSubTaskById(cardId, subTaskId, req.user!);
    if (!updatedCard) {
       res.status(404).json({ message: 'Card or sub-task not found' });
       return;
    }

     res.status(200).json(updatedCard);
     return;
  } catch (error: any) {
    next(error);
  }
};

/* -----------------------------------------------------------
   TIME LOG ENDPOINTS
----------------------------------------------------------- */

/**
 * Log Time
 */
export const logTimeHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { userId, start, end } = req.body;

    // Convert start/end to Date
    const startDate = new Date(start);
    const endDate = new Date(end);

    const updatedCard = await logTime(cardId, userId, startDate, endDate);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card not found or error logging time' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};

/* -----------------------------------------------------------
   CUSTOM FIELDS ENDPOINTS
----------------------------------------------------------- */

/**
 * Add Custom Field
 */
export const addCustomFieldHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { key, value } = req.body;

    const updatedCard = await addCustomField(
      cardId, 
      { key, value },
      req.user!
    );

    if (!updatedCard) {
      res.status(404).json({ message: 'Card not found or error adding custom field' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update Custom Field
 */
export const updateCustomFieldHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, fieldIndex } = req.params;
    const updates = req.body; // e.g. { key: "Priority", value: "High" }

    const idx = parseInt(fieldIndex, 10);
    const updatedCard = await updateCustomField(cardId, idx, updates, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card or custom field not found' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete Custom Field
 */
export const deleteCustomFieldHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, fieldIndex } = req.params;
    const idx = parseInt(fieldIndex, 10);

    const updatedCard = await deleteCustomField(cardId, idx, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card or custom field not found' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Like a Card
 */
export const likeCardHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cardId } = req.params;
      const userId = req.user!._id.toString(); // Convert ObjectId to string
  
      const card = await likeCard(cardId, userId, req.user!);
      if (!card) {
        res.status(404).json({ message: 'Card not found' });
        return;
      }
  
      res.status(200).json({ message: 'Card liked successfully', card });
    } catch (error: any) {
      next(error);
    }
  };
  
  /**
   * Unlike a Card
   */
  export const unlikeCardHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cardId } = req.params;
      const userId = req.user!._id.toString(); // Convert ObjectId to string
  
      const card = await unlikeCard(cardId, userId, req.user!);
      if (!card) {
        res.status(404).json({ message: 'Card not found' });
        return;
      }
  
      res.status(200).json({ message: 'Card unliked successfully', card });
    } catch (error: any) {
      next(error);
    }
  };
  
  /**
   * Add Watcher to Card
   */
  export const addWatcherToCardHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cardId } = req.params;
      const { userId } = req.body; // Assuming admin can add watchers
  
      const card = await addWatcherToCard(cardId, userId, req.user!);
      if (!card) {
        res.status(404).json({ message: 'Card not found' });
        return;
      }
  
      res.status(200).json({ message: 'Watcher added successfully', card });
    } catch (error: any) {
      next(error);
    }
  };
  
  /**
   * Remove Watcher from Card
   */
  export const removeWatcherFromCardHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cardId } = req.params;
      const { userId } = req.body; // Assuming admin can remove watchers
  
      const card = await removeWatcherFromCard(cardId, userId, req.user!);
      if (!card) {
        res.status(404).json({ message: 'Card not found' });
        return;
      }
  
      res.status(200).json({ message: 'Watcher removed successfully', card });
    } catch (error: any) {
      next(error);
    }
  };
  
/**
 * Get Sub-Task by ID
 */
export const getSubTaskByIdHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, subTaskId } = req.params;
    const subTask = await getSubTaskById(cardId, subTaskId);

    if (!subTask) {
      res.status(404).json({ message: 'Sub-Task not found' });
      return;
    }

    res.status(200).json(subTask);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get Time Log by ID
 */
export const getTimeLogByIdHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, timeLogId } = req.params;
    const timeLog = await getTimeLogById(cardId, timeLogId);

    if (!timeLog) {
      res.status(404).json({ message: 'Time Log not found' });
      return;
    }

    res.status(200).json(timeLog);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get Custom Field by ID
 */
export const getCustomFieldByIdHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, customFieldId } = req.params;
    const customField = await getCustomFieldById(cardId, customFieldId);

    if (!customField) {
      res.status(404).json({ message: 'Custom Field not found' });
      return;
    }

    res.status(200).json(customField);
  } catch (error: any) {
    next(error);
  }
};

// --------------------------- ADD LABEL TO CARD ---------------------------
export const addLabelToCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { labelId } = req.body;

    const updatedCard = await addLabelToCard(cardId, labelId, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card or Label not found' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};

// --------------------------- REMOVE LABEL FROM CARD ---------------------------
export const removeLabelFromCardHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId } = req.params;
    const { labelId } = req.body;

    const updatedCard = await removeLabelFromCard(cardId, labelId, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card or Label not found' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};

export const fetchCardsByBoardIdHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const {
      search = '',
      progress,
      startDateFrom,
      startDateTo,
      dueDateFrom,
      dueDateTo,
      page = '1',
      limit = '10',
    } = req.query;

    // Validate boardId
    if (!mongoose.Types.ObjectId.isValid(boardId as string)) {
      res.status(400).json({ message: 'Invalid Board ID' });
      return;
    }

    // Check if the user has access to the board
    const board = await getBoardById(boardId as string);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Allow admin to access all boards
    if (req.user.role !== 'admin') {
      const isMember = board.members.some(
        (member) => member.toString() === req.user!._id.toString()
      );

      if (!isMember) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
    }

    // Parse pagination parameters
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Fetch cards with filters
    const [cards, total] = await getCardsByBoardIdWithFilters({
      boardId: boardId as string,
      search: search as string,
      progress: progress ? Number(progress) : undefined,
      startDateFrom: startDateFrom as string,
      startDateTo: startDateTo as string,
      dueDateFrom: dueDateFrom as string,
      dueDateTo: dueDateTo as string,
      skip,
      limit: pageSize,
    });

    res.status(200).json({
      data: cards,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    next(error);
  }
};

export const fetchAllCardsByBoardIdHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;

    // Validate boardId
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      res.status(400).json({ message: 'Invalid Board ID' });
      return;
    }

    // Check if the user has access to the board
    const board = await getBoardById(boardId);
    if (!board) {
      res.status(404).json({ message: 'Board not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Allow admin to access all boards
    if (req.user.role !== 'admin') {
      const isMember = board.members.some(
        (member) => member.toString() === req.user!._id.toString()
      );

      if (!isMember) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
    }

    const cards = await getCardByBoardId(boardId);
    res.status(200).json(cards);
  } catch (error: any) {
    next(error);
  }
};