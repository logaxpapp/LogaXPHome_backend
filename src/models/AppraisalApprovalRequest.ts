// src/models/AppraisalApprovalRequest.ts

import mongoose, { Schema, Model, Document } from 'mongoose';
import ApprovalRequestBase, { IApprovalRequestBase } from './ApprovalRequest';
import AppraisalPeriod, { IAppraisalPeriod } from './AppraisalPeriod'; // Import the AppraisalPeriod model

/**
 * Interface extending IApprovalRequestBase with specific appraisal request data fields.
 */
export interface IAppraisalApprovalRequest extends IApprovalRequestBase {
  request_data: {
    period: mongoose.Types.ObjectId | IAppraisalPeriod; // Reference to AppraisalPeriod
    comments: string;
    additional_metrics?: {
      metricId: mongoose.Types.ObjectId;
      value: number;
    }[]; // Array of metrics
    responses: {
      questionId: mongoose.Types.ObjectId;
      answer: string;
    }[];
  };
}

/**
 * Schema specific to Appraisal requests.
 * Validation included to ensure data integrity.
 */
const AppraisalApprovalRequestSchema: Schema<IAppraisalApprovalRequest> = new Schema({
  request_data: {
    period: {
      type: Schema.Types.ObjectId,
      ref: 'AppraisalPeriod',
      required: true,
    },
    comments: { 
      type: String, 
      required: true, 
      minlength: 5 // Minimum length to ensure meaningful comments
    },
    additional_metrics: [
      {
        metricId: { type: Schema.Types.ObjectId, ref: 'AppraisalMetric', required: true },
        value: { type: Number, required: true }, // Score or response for the metric
      }
    ],
    responses: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'AppraisalQuestion', required: true },
        answer: { type: String, required: true },
      }
    ],
  },
});

/**
 * Discriminator for Appraisal type requests based on ApprovalRequestBase.
 * Future-proofed to add new appraisal-specific fields without modifying the base.
 */
const AppraisalApprovalRequest: Model<IAppraisalApprovalRequest> = ApprovalRequestBase.discriminator<IAppraisalApprovalRequest>(
  'Appraisal',
  AppraisalApprovalRequestSchema
);

export default AppraisalApprovalRequest;
