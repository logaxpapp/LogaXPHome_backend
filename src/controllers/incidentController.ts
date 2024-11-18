// src/controllers/incidentController.ts

import { Request, Response, NextFunction } from 'express';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
} from '../services/incidentService';
import { IncidentType, IncidentSeverity } from '../models/Incident';

// Handler to Create an Incident
export const createIncidentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, type, severity, location } = req.body;

    // Validate required fields
    if (!title || !description || !type || !severity || !location) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    // Validate Incident Type and Severity
    if (!Object.values(IncidentType).includes(type)) {
      res.status(400).json({ message: 'Invalid Incident Type.' });
      return;
    }

    if (!Object.values(IncidentSeverity).includes(severity)) {
      res.status(400).json({ message: 'Invalid Incident Severity.' });
      return;
    }

    const incident = await createIncident({
      title,
      description,
      type,
      severity,
      location,
      createdBy: req.user!._id,
    });

    res.status(201).json({ message: 'Incident created successfully.', incident });
  } catch (error: any) {
    next(error);
  }
};

// Handler to Get Incidents
export const getIncidentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, type, severity, search } = req.query;

    const incidentsData = await getIncidents({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      type: type as IncidentType,
      severity: severity as IncidentSeverity,
      search: search as string,
    });

    res.status(200).json(incidentsData);
  } catch (error: any) {
    next(error);
  }
};

// Handler to Get Incident by ID
export const getIncidentByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const incident = await getIncidentById(id);
    if (!incident) {
      res.status(404).json({ message: 'Incident not found.' });
      return;
    }

    res.status(200).json(incident);
  } catch (error: any) {
    next(error);
  }
};

// Handler to Update an Incident
export const updateIncidentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, type, severity, location } = req.body;

    // Validate Incident Type and Severity if being updated
    if (type && !Object.values(IncidentType).includes(type)) {
      res.status(400).json({ message: 'Invalid Incident Type.' });
      return;
    }

    if (severity && !Object.values(IncidentSeverity).includes(severity)) {
      res.status(400).json({ message: 'Invalid Incident Severity.' });
      return;
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (type) updates.type = type;
    if (severity) updates.severity = severity;
    if (location) updates.location = location;

    const updatedIncident = await updateIncident(id, updates);

    if (!updatedIncident) {
      res.status(404).json({ message: 'Incident not found.' });
      return;
    }

    res.status(200).json({ message: 'Incident updated successfully.', incident: updatedIncident });
  } catch (error: any) {
    next(error);
  }
};

// Handler to Delete an Incident
export const deleteIncidentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await deleteIncident(id);
    res.status(200).json({ message: 'Incident deleted successfully.' });
  } catch (error: any) {
    next(error);
  }
};
