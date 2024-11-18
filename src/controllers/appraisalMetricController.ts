// src/controllers/appraisalMetricController.ts

import { Request, Response } from 'express';
import {
  createAppraisalMetricService,
  getAppraisalMetricsService,
  getAppraisalMetricByIdService,
  updateAppraisalMetricService,
  deleteAppraisalMetricService,
} from '../services/appraisalMetricService';
import { validationResult } from 'express-validator';

/**
 * Controller: Create a new appraisal metric.
 */
export const createAppraisalMetricHandler = async (req: Request, res: Response): Promise<void> => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { metric_name, description, scale, associated_questions } = req.body;

  try {
    const newMetric = await createAppraisalMetricService({
      metric_name,
      description,
      scale,
      associated_questions,
    });

    res.status(201).json({ message: 'Appraisal metric created successfully', data: newMetric });
  } catch (error: any) {
    console.error('Error creating appraisal metric:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Controller: Get all appraisal metrics with optional filters.
 */
export const getAppraisalMetricsHandler = async (req: Request, res: Response): Promise<void> => {
  const { metric_name } = req.query;

  try {
    const metrics = await getAppraisalMetricsService({
      metric_name: metric_name as string,
    });

    res.status(200).json({ data: metrics });
  } catch (error: any) {
    console.error('Error fetching appraisal metrics:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Controller: Get a single appraisal metric by ID.
 */
export const getAppraisalMetricByIdHandler = async (req: Request, res: Response): Promise<void> => {
  // Extract validation errors from the request, if any
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id } = req.params;

  // Basic ObjectID format check
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({ message: 'Invalid appraisal metric ID format' });
    return;
  }

  try {
    const metric = await getAppraisalMetricByIdService(id);

    if (!metric) {
      res.status(404).json({ message: 'Appraisal metric not found' });
      return;
    }

    res.status(200).json({ data: metric });
  } catch (error) {
    console.error(`Error fetching appraisal metric with ID ${id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller: Update an appraisal metric by ID.
 */
export const updateAppraisalMetricHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { metric_name, description, scale, associated_questions } = req.body;

  // Basic ObjectID format check
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({ message: 'Invalid appraisal metric ID format' });
    return;
  }

  try {
    const updatedMetric = await updateAppraisalMetricService(id, {
      metric_name,
      description,
      scale,
      associated_questions,
    });

    if (!updatedMetric) {
      res.status(404).json({ message: 'Appraisal metric not found' });
      return;
    }

    res.status(200).json({ message: 'Appraisal metric updated successfully', data: updatedMetric });
  } catch (error: any) {
    console.error('Error updating appraisal metric:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Controller: Delete an appraisal metric by ID.
 */
export const deleteAppraisalMetricHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Basic ObjectID format check
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({ message: 'Invalid appraisal metric ID format' });
    return;
  }

  try {
    await deleteAppraisalMetricService(id);
    res.status(200).json({ message: 'Appraisal metric deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting appraisal metric:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
