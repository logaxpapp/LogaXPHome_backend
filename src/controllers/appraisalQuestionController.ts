// src/controllers/appraisalQuestionController.ts

import { Request, Response } from 'express';
import {
  createAppraisalQuestionService,
  getAppraisalQuestionsService,
  updateAppraisalQuestionService,
  deleteAppraisalQuestionService,
  getAppraisalQuestionByIdService,
} from '../services/appraisalQuestionService';
import { validationResult } from 'express-validator';

/**
 * Controller: Create a new appraisal question.
 */
export const createAppraisalQuestionHandler = async (req: Request, res: Response): Promise<void> => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { question_text, question_type, options, appraisal_type, period } = req.body;

  try {
    const newQuestion = await createAppraisalQuestionService({
      question_text,
      question_type,
      options,
      appraisal_type,
      period,
    });

    res.status(201).json({ message: 'Appraisal question created successfully', data: newQuestion });
  } catch (error: any) {
    console.error('Error creating appraisal question:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Controller: Get all appraisal questions with optional filters.
 */
export const getAppraisalQuestionsHandler = async (req: Request, res: Response): Promise<void> => {
  const { appraisal_type, period } = req.query;

  try {
    const questions = await getAppraisalQuestionsService({
      appraisal_type: appraisal_type as string,
      period: period as string,
    });

    res.status(200).json({ data: questions });
  } catch (error: any) {
    console.error('Error fetching appraisal questions:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};
/**
 * Controller: Get a single appraisal question by ID.
 * @param req - Express Request object.
 * @param res - Express Response object.
 */
export const getAppraisalQuestionByIdHandler = async (req: Request, res: Response): Promise<void> => {
  // Extract validation errors from the request, if any
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id } = req.params;

  try {
    const question = await getAppraisalQuestionByIdService(id);

    if (!question) {
      res.status(404).json({ message: 'Appraisal question not found' });
      return;
    }

    res.status(200).json({ data: question });
  } catch (error) {
    console.error(`Error fetching appraisal question with ID ${id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
};
/**
 * Controller: Update an appraisal question by ID.
 */
export const updateAppraisalQuestionHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { question_text, question_type, options, appraisal_type, period } = req.body;

  try {
    const updatedQuestion = await updateAppraisalQuestionService(id, {
      question_text,
      question_type,
      options,
      appraisal_type,
      period,
    });

    res.status(200).json({ message: 'Appraisal question updated successfully', data: updatedQuestion });
  } catch (error: any) {
    console.error('Error updating appraisal question:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Controller: Delete an appraisal question by ID.
 */
export const deleteAppraisalQuestionHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await deleteAppraisalQuestionService(id);
    res.status(200).json({ message: 'Appraisal question deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting appraisal question:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};


