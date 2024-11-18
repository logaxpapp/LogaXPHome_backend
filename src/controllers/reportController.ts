// src/controllers/reportController.ts

import { Request, Response } from 'express';
import {
  getApprovalStatusReportService,
  getAveragePerformanceRatingService,
} from '../services/reportService';

/**
 * Type guard to check if a variable is an instance of Error
 */
const isError = (error: unknown): error is Error => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

/**
 * Controller: Get approval status report
 */
export const getApprovalStatusReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getApprovalStatusReportService();
    res.status(200).json(report);
  } catch (error) {
    if (isError(error)) {
      console.error('Error fetching approval status report:', error);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Error fetching approval status report:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

/**
 * Controller: Get average performance ratings
 */
export const getAveragePerformanceRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getAveragePerformanceRatingService();
    res.status(200).json(report);
  } catch (error) {
    if (isError(error)) {
      console.error('Error fetching average performance rating:', error);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Error fetching average performance rating:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
