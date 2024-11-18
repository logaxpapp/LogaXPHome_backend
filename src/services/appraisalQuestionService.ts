// src/services/appraisalQuestionService.ts

import AppraisalQuestion, { IAppraisalQuestion } from '../models/AppraisalQuestion';

/**
 * Service: Create a new appraisal question.
 * @param payload - Data required to create the appraisal question.
 * @returns The created appraisal question document.
 */
interface CreateAppraisalQuestionPayload {
  question_text: string;
  question_type: string;
  options?: string[];
  appraisal_type?: string;
  period?: string;
}

export const createAppraisalQuestionService = async (
  payload: CreateAppraisalQuestionPayload
): Promise<IAppraisalQuestion> => {
  const { question_text, question_type, options, appraisal_type, period } = payload;

  const newQuestion = new AppraisalQuestion({
    question_text,
    question_type,
    options,
    appraisal_type,
    period,
  });

  await newQuestion.save();
  return newQuestion;
};

/**
 * Service: Retrieve appraisal questions with optional filters.
 * @param filters - Filters to apply (appraisal_type, period).
 * @returns An array of appraisal question documents.
 */
interface GetAppraisalQuestionsFilters {
  appraisal_type?: string;
  period?: string;
}

export const getAppraisalQuestionsService = async (
  filters: GetAppraisalQuestionsFilters
): Promise<IAppraisalQuestion[]> => {
  const query: any = {};

  if (filters.appraisal_type) query.appraisal_type = filters.appraisal_type;
  if (filters.period) query.period = filters.period;

  const questions = await AppraisalQuestion.find(query).exec();
  return questions;
};

/**
 * Service: Retrieve a single appraisal question by ID.
 * @param id - The ID of the appraisal question.
 * @returns The appraisal question document or null if not found.
 */
export const getAppraisalQuestionByIdService = async (
  id: string
): Promise<IAppraisalQuestion | null> => {
  const question = await AppraisalQuestion.findById(id).exec();
  return question;
};

/**
 * Service: Update an appraisal question by ID.
 * @param id - The ID of the appraisal question.
 * @param payload - Data to update.
 * @returns The updated appraisal question document.
 */
export const updateAppraisalQuestionService = async (
  id: string,
  payload: CreateAppraisalQuestionPayload
): Promise<IAppraisalQuestion> => {
  const updatedQuestion = await AppraisalQuestion.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).exec();

  if (!updatedQuestion) {
    throw new Error('Appraisal question not found');
  }

  return updatedQuestion;
};

/**
 * Service: Delete an appraisal question by ID.
 * @param id - The ID of the appraisal question.
 */
export const deleteAppraisalQuestionService = async (id: string): Promise<void> => {
  const deletedQuestion = await AppraisalQuestion.findByIdAndDelete(id).exec();

  if (!deletedQuestion) {
    throw new Error('Appraisal question not found');
  }
};
