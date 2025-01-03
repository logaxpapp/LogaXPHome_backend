// src/controllers/cardController.ts

import { Request, Response, NextFunction } from 'express';


import {
  createCard,
  getCardById,
  updateCard,
  deleteCard,
  assignUserToCard,
  addSubTask,
  updateSubTask,
  deleteSubTask,
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

} from '../../services/Task/cardService';
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
      const { title, description, list, assignees, labels, dueDate, position } = req.body;
      const card = await createCard(
        {
          title,
          description,
          list, // Directly use 'list' from req.body
          assignees,
          labels,
          dueDate,
          position,
        },
        req.user!
      );
      res.status(201).json(card);
    } catch (error: any) {
      next(error);
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
    next(error);
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
    await deleteCard(cardId, req.user!);
    res.status(200).json({ message: 'Card deleted successfully' });
  } catch (error: any) {
    next(error);
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

    const updatedCard = await assignUserToCard(cardId, userId);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    res.status(200).json({ message: 'User assigned to card successfully' });
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
      { title, completed: false, dueDate, assignee, id: '' }, // 'id' will be generated
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
 * Update Sub-Task
 */
export const updateSubTaskHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, subtaskIndex } = req.params;
    const updates = req.body; // e.g. { title: "New Title", completed: true }

    const subIndex = parseInt(subtaskIndex, 10);
    const updatedCard = await updateSubTask(cardId, subIndex, updates, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card or sub-task not found' });
      return;
    }

    res.status(200).json(updatedCard);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete Sub-Task
 */
export const deleteSubTaskHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cardId, subtaskIndex } = req.params;
    const subIndex = parseInt(subtaskIndex, 10);

    const updatedCard = await deleteSubTask(cardId, subIndex, req.user!);

    if (!updatedCard) {
      res.status(404).json({ message: 'Card or sub-task not found' });
      return;
    }

    res.status(200).json(updatedCard);
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