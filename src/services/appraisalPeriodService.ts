// src/services/appraisalPeriodService.ts

import AppraisalPeriod, { IAppraisalPeriod } from '../models/AppraisalPeriod';

/**
 * Create a new appraisal period.
 * @param data - Data for the new appraisal period.
 * @returns The created appraisal period.
 */
export const createAppraisalPeriodService = async (data: Partial<IAppraisalPeriod>): Promise<IAppraisalPeriod> => {
  const newPeriod = new AppraisalPeriod(data);
  await newPeriod.save();
  return newPeriod;
};

/**
 * Get all appraisal periods, optionally sorted.
 * @returns An array of appraisal periods.
 */
export const getAllAppraisalPeriodsService = async (): Promise<IAppraisalPeriod[]> => {
  return await AppraisalPeriod.find().sort({ startDate: -1 }).exec();
};

/**
 * Update an appraisal period by ID.
 * @param id - The ID of the appraisal period.
 * @param data - The data to update.
 * @returns The updated appraisal period or null if not found.
 */
export const updateAppraisalPeriodService = async (id: string, data: Partial<IAppraisalPeriod>): Promise<IAppraisalPeriod | null> => {
  return await AppraisalPeriod.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
};

/**
 * Delete an appraisal period by ID.
 * @param id - The ID of the appraisal period.
 * @returns The deleted appraisal period or null if not found.
 */
export const deleteAppraisalPeriodService = async (id: string): Promise<IAppraisalPeriod | null> => {
  return await AppraisalPeriod.findByIdAndDelete(id).exec();
};
