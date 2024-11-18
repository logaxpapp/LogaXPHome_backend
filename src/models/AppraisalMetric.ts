// src/models/AppraisalMetric.ts

import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAppraisalQuestion } from './AppraisalQuestion';

// Interface for AppraisalMetric
export interface IAppraisalMetric extends Document {
  metric_name: string;
  description: string;
  scale?: number; // e.g., 1-5 for rating
  associated_questions: mongoose.Types.ObjectId[] | IAppraisalQuestion[];
  created_at: Date;
  updated_at: Date;
}

// AppraisalMetric Schema
const AppraisalMetricSchema: Schema<IAppraisalMetric> = new Schema(
  {
    metric_name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    scale: { type: Number }, // Applicable for rating metrics
    associated_questions: [{ type: Schema.Types.ObjectId, ref: 'AppraisalQuestion' }],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Indexes for faster queries
AppraisalMetricSchema.index({ metric_name: 1 });

const AppraisalMetric: Model<IAppraisalMetric> = mongoose.model<IAppraisalMetric>('AppraisalMetric', AppraisalMetricSchema);

export default AppraisalMetric;
