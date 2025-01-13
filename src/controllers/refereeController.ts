import { Request, Response, NextFunction } from 'express';
import {
  addReferee,
  getReferees,
  getRefereeById,
  updateReferee,
  deleteReferee,
} from '../services/refereeService';
import { IUser } from '../models/User';

/**
 * Add a new referee
 */
export const addRefereeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: IUser = req.user!;
    const refereeData = req.body; // Make sure the frontend is sending matching fields

    const referee = await addReferee(user._id, refereeData);
    res.status(201).json(referee);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Handler to get all referees for the user with optional search and pagination
 */
export const getRefereesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: IUser = req.user!;
    const { search, page, limit } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;

    const result = await getReferees(
      user._id,
      search as string,
      pageNumber,
      limitNumber
    );

    res.status(200).json(result);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get a referee by ID
 */
export const getRefereeByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: IUser = req.user!;
    const { refereeId } = req.params;

    const referee = await getRefereeById(refereeId, user._id);
    if (!referee) {
      res.status(404).json({ message: 'Referee not found.' });
      return;
    }

    res.status(200).json(referee);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update a referee
 */
export const updateRefereeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: IUser = req.user!;
    const { refereeId } = req.params;
    const updates = req.body;

    const updatedReferee = await updateReferee(refereeId, user._id, updates);
    if (!updatedReferee) {
      res.status(404).json({ message: 'Referee not found.' });
    return;
    }

    res.status(200).json(updatedReferee);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete a referee
 */
export const deleteRefereeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: IUser = req.user!;
    const { refereeId } = req.params;

    await deleteReferee(refereeId, user._id);
    res.status(200).json({ message: 'Referee deleted successfully.' });
  } catch (error: any) {
    next(error);
  }
};
