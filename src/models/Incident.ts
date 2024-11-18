// src/models/Incident.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

// Enums for Incident Types and Severity
export enum IncidentType {
  NaturalDisaster = 'Natural Disaster',
  Traffic = 'Traffic',
  PoliticalUnrest = 'Political Unrest',
  Other = 'Other',
}

export enum IncidentSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

// Interface for Incident
export interface IIncident extends Document {
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  location: string;
  createdBy: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Incident Schema
const IncidentSchema: Schema<IIncident> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: Object.values(IncidentType), required: true },
    severity: { type: String, enum: Object.values(IncidentSeverity), required: true },
    location: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Incident Model
const Incident: Model<IIncident> = mongoose.model<IIncident>('Incident', IncidentSchema);
export default Incident;
