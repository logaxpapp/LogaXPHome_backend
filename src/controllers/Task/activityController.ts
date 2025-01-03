// /src/controllers/activityController.ts
import { Request, Response, NextFunction } from 'express';
import {
  createActivity,
  getActivities,
  getActivityById,
  deleteActivity,
  // updateActivity  (if needed)
} from '../../services/Task/activityService';

/**
 * CREATE
 */
export const createActivityHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newActivity = await createActivity(req.body);
    res.status(201).json(newActivity);
  } catch (error) {
    next(error);
  }
};

/**
 * GET MULTIPLE
 */
export const getActivitiesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { boardId, listId, cardId, page, limit } = req.query;

    const pageNum = page ? parseInt(page as string, 10) : undefined;
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;

    const activities = await getActivities(
      boardId as string,
      listId as string,
      cardId as string,
      pageNum,
      limitNum
    );
    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

/**
 * GET BY ID
 */
export const getActivityByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activityId } = req.params;
    const activity = await getActivityById(activityId);
    if (!activity) {
       res.status(404).json({ message: 'Activity not found.' });
         return;
    }
    res.status(200).json(activity);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE
 */
export const deleteActivityHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activityId } = req.params;
    const deleted = await deleteActivity(activityId);
    if (!deleted) {
      res.status(404).json({ message: 'Activity not found or invalid ID.' });
      return;
    }
    res.status(200).json({ message: 'Activity deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/* 
  // If you want to allow updating an Activity, e.g. "updateActivityHandler":

  export const updateActivityHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activityId } = req.params;
      const updated = await updateActivity(activityId, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Activity not found or invalid ID.' });
      }
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };
*/
