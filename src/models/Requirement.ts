// src/models/Requirement.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Reuse the same applications array from your testCase model or define it here:
export const APPLICATIONS = [
  'GatherPlux',
  'BookMiz',
  'BeautyHub',
  'TimeSync',
  'TaskBrick',
  'ProFixer',
  'DocSend',
  'LogaXP',
  'CashVent',
] as const;

export interface IRequirement extends Document {
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  application: typeof APPLICATIONS[number]; // Add this
  createdAt: Date;
  updatedAt: Date;
}

const RequirementSchema = new Schema<IRequirement>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Done'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // Enforce that each Requirement belongs to one application
    application: {
      type: String,
      enum: APPLICATIONS,
      required: true,
    },
  },
  { timestamps: true }
);

const Requirement: Model<IRequirement> = mongoose.model<IRequirement>(
  'Requirement',
  RequirementSchema
);
export default Requirement;
