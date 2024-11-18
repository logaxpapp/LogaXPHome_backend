// src/services/incidentService.ts

import Incident, { IIncident, IncidentType, IncidentSeverity } from '../models/Incident';
import mongoose from 'mongoose';

// Input Interfaces
interface CreateIncidentInput {
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  location: string;
  createdBy: mongoose.Types.ObjectId;
}

interface UpdateIncidentInput {
  title?: string;
  description?: string;
  type?: IncidentType;
  severity?: IncidentSeverity;
  location?: string;
}

// Create a new Incident
export const createIncident = async (input: CreateIncidentInput): Promise<IIncident> => {
  const incident = new Incident(input);
  await incident.save();
  return incident;
};

// Get Incidents with Pagination and Filters
interface GetIncidentsInput {
  page?: number;
  limit?: number;
  type?: IncidentType;
  severity?: IncidentSeverity;
  search?: string;
}

export const getIncidents = async (input: GetIncidentsInput): Promise<{ incidents: IIncident[]; total: number }> => {
  const { page = 1, limit = 10, type, severity, search } = input;

  const query: any = {};

  if (type) {
    query.type = type;
  }

  if (severity) {
    query.severity = severity;
  }

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  const total = await Incident.countDocuments(query);
  const incidents = await Incident.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  return { incidents, total };
};

// Get Incident by ID
export const getIncidentById = async (id: string): Promise<IIncident | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid Incident ID.' };
  }

  const incident = await Incident.findById(id).populate('createdBy', 'name email').exec();
  return incident;
};

// Update Incident
export const updateIncident = async (id: string, updates: UpdateIncidentInput): Promise<IIncident | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid Incident ID.' };
  }

  const incident = await Incident.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('createdBy', 'name email').exec();
  return incident;
};

// Delete Incident
export const deleteIncident = async (id: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid Incident ID.' };
  }

  const result = await Incident.findByIdAndDelete(id).exec();
  if (!result) {
    throw { status: 404, message: 'Incident not found.' };
  }
};
