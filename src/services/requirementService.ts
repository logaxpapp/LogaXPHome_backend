

import Requirement, { IRequirement } from '../models/Requirement';
import mongoose from 'mongoose';

interface GetAllRequirementsOptions {
  application?: string; // optional filter
}

export async function createRequirement(
  data: Partial<IRequirement>
): Promise<IRequirement> {
  const reqDoc = new Requirement(data);
  return reqDoc.save();
}

export async function getAllRequirements(
  options?: GetAllRequirementsOptions
): Promise<IRequirement[]> {
  const query: any = {};
  if (options?.application) {
    query.application = options.application;
  }

  return Requirement.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .exec();
}

export async function getRequirementById(
  id: string
): Promise<IRequirement | null> {
  return Requirement.findById(id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .exec();
}

export async function updateRequirement(
  id: string,
  data: Partial<IRequirement>
): Promise<IRequirement | null> {
  return Requirement.findByIdAndUpdate(id, data, { new: true })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .exec();
}

export async function deleteRequirement(id: string): Promise<boolean> {
  const result = await Requirement.findByIdAndDelete(id).exec();
  return !!result;
}
