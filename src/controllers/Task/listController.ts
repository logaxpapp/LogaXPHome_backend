// src/controllers/listController.ts

import { Request, Response, NextFunction } from 'express';
import {
  createList,
  getListById,
  updateList,
  deleteList,
} from '../../services/Task/listService';
import { IUser } from '../../models/User';
import List from '../../models/Task/List';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const createListHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, boardId, position } = req.body;
    const list = await createList({ name, board: boardId, position });
    res.status(201).json(list);
  } catch (error: any) {
    next(error);
  }
};

export const getListHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { listId } = req.params;
    const list = await getListById(listId);

    if (!list) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    res.status(200).json(list);
  } catch (error: any) {
    next(error);
  }
};

export const updateListHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { listId } = req.params;
    const updates = req.body;

    const updatedList = await updateList(listId, updates);

    if (!updatedList) {
      res.status(404).json({ message: 'List not found' });
      return;
    }

    res.status(200).json(updatedList);
  } catch (error: any) {
    next(error);
  }
};

export const deleteListHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { listId } = req.params;
    await deleteList(listId);
    res.status(200).json({ message: 'List deleted successfully' });
  } catch (error: any) {
    next(error);
  }
};

export const getListsByHeaderHandler = async (req: Request, res: Response) => {
    try {
      const { boardId, header } = req.params;
  
      // Find lists by header
      const lists = await List.find({ board: boardId, header })
        .populate('cards')
        .exec();
  
      res.status(200).json(lists);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lists by header' });
    }
  };