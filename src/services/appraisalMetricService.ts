// src/services/appraisalMetricService.ts

import AppraisalMetric, { IAppraisalMetric } from '../models/AppraisalMetric';

/**
 * Service: Create a new appraisal metric.
 * @param payload - Data required to create the appraisal metric.
 * @returns The created appraisal metric document.
 */
interface CreateAppraisalMetricPayload {
  metric_name: string;
  description: string;
  scale?: number;
  associated_questions?: string[]; // Array of AppraisalQuestion IDs
}

export const createAppraisalMetricService = async (
  payload: CreateAppraisalMetricPayload
): Promise<IAppraisalMetric> => {
  const { metric_name, description, scale, associated_questions } = payload;

  const newMetric = new AppraisalMetric({
    metric_name,
    description,
    scale,
    associated_questions,
  });

  await newMetric.save();
  return newMetric;
};

/**
 * Service: Retrieve all appraisal metrics with optional filters.
 * @param filters - Filters to apply (e.g., metric_name).
 * @returns An array of appraisal metric documents.
 */
interface GetAppraisalMetricsFilters {
  metric_name?: string;
}

export const getAppraisalMetricsService = async (
  filters: GetAppraisalMetricsFilters
): Promise<IAppraisalMetric[]> => {
  const query: any = {};

  if (filters.metric_name) query.metric_name = filters.metric_name;

  const metrics = await AppraisalMetric.find(query).populate('associated_questions').exec();
  return metrics;
};

/**
 * Service: Retrieve a single appraisal metric by ID.
 * @param id - The ID of the appraisal metric.
 * @returns The appraisal metric document or null if not found.
 */
export const getAppraisalMetricByIdService = async (
  id: string
): Promise<IAppraisalMetric | null> => {
  const metric = await AppraisalMetric.findById(id).populate('associated_questions').exec();
  return metric;
};

/**
 * Service: Update an appraisal metric by ID.
 * @param id - The ID of the appraisal metric.
 * @param payload - Data to update.
 * @returns The updated appraisal metric document or null if not found.
 */
export const updateAppraisalMetricService = async (
  id: string,
  payload: Partial<CreateAppraisalMetricPayload>
): Promise<IAppraisalMetric | null> => {
  const updatedMetric = await AppraisalMetric.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate('associated_questions').exec();

  return updatedMetric;
};

/**
 * Service: Delete an appraisal metric by ID.
 * @param id - The ID of the appraisal metric.
 */
export const deleteAppraisalMetricService = async (id: string): Promise<void> => {
  const deletedMetric = await AppraisalMetric.findByIdAndDelete(id).exec();

  if (!deletedMetric) {
    throw new Error('Appraisal metric not found');
  }
};
