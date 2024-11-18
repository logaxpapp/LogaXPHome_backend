// src/controllers/appraisalPeriodController.ts

import { Request, Response, NextFunction } from 'express';
import {
  createAppraisalPeriodService,
  getAllAppraisalPeriodsService,
  updateAppraisalPeriodService,
  deleteAppraisalPeriodService,
} from '../services/appraisalPeriodService';

/**
 * Type guard to check if a variable is an instance of Error
 */
const isError = (error: unknown): error is Error => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

/**
 * Controller: Create a new appraisal period
 */
export const createAppraisalPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, startDate, endDate, isActive, submissionDeadline, reviewDeadline } = req.body;
    const newPeriod = await createAppraisalPeriodService({ name, startDate, endDate, isActive, submissionDeadline, reviewDeadline });
    res.status(201).json(newPeriod);
    return; // Explicitly return to ensure no value is returned
  } catch (error) {
    if (isError(error)) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
    return; // Explicitly return to ensure no value is returned
  }
};

/**
 * Controller: Get all appraisal periods
 */
export const getAppraisalPeriods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const periods = await getAllAppraisalPeriodsService();
    res.status(200).json(periods);
    return;
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
    return;
  }
};

/**
 * Controller: Update an appraisal period
 */
export const updateAppraisalPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedPeriod = await updateAppraisalPeriodService(id, req.body);
    if (!updatedPeriod) {
      res.status(404).json({ error: 'Appraisal Period not found.' });
      return;
    }
    res.status(200).json(updatedPeriod);
    return;
  } catch (error) {
    if (isError(error)) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
    return;
  }
};

/**
 * Controller: Delete an appraisal period
 */
export const deleteAppraisalPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedPeriod = await deleteAppraisalPeriodService(id);
    if (!deletedPeriod) {
      res.status(404).json({ error: 'Appraisal Period not found.' });
      return;
    }
    res.status(200).json({ message: 'Appraisal Period deleted successfully.' });
    return;
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
    return;
  }
};
