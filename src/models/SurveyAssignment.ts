// src/models/SurveyAssignment.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';
import { ISurvey } from './Survey';

export interface ISurveyAssignment extends Document {
  survey: mongoose.Types.ObjectId | ISurvey;
  user?: mongoose.Types.ObjectId | IUser; // Optional for registered users
  email?: string; // Optional for non-registered participants
  due_date?: Date;
  status: 'Pending' | 'Completed';
  completed_at?: Date;
}

const SurveyAssignmentSchema: Schema<ISurveyAssignment> = new Schema(
  {
    survey: { type: Schema.Types.ObjectId, ref: 'Survey', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional
    email: { type: String, validate: { validator: (v: string) => /\S+@\S+\.\S+/.test(v), message: 'Invalid email format' } }, // Optional
    due_date: { type: Date },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    completed_at: { type: Date },
  },
  { timestamps: true }
);

// Indexes for efficient queries
SurveyAssignmentSchema.index({ user: 1, email: 1, status: 1 });

const SurveyAssignment: Model<ISurveyAssignment> = mongoose.model<ISurveyAssignment>('SurveyAssignment', SurveyAssignmentSchema);
export default SurveyAssignment;
