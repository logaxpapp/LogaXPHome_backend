// src/models/AppraisalPeriod.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing an appraisal period document.
 */
export interface IAppraisalPeriod extends Document {
  name: string; // e.g., "Q1 2024", "Annual 2024"
  startDate: Date;
  endDate: Date;
  isActive: boolean; // Indicates if the period is currently active
  submissionDeadline: Date; // Deadline for submitting appraisal requests
  reviewDeadline: Date; // Deadline for reviewing and approving
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for AppraisalPeriod.
 */
const AppraisalPeriodSchema: Schema<IAppraisalPeriod> = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensure each period has a unique name
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IAppraisalPeriod, value: Date) {
          return value > this.startDate;
        },
        message: 'End date must be after the start date.',
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    submissionDeadline: {
      type: Date,
      required: true,
    },
    reviewDeadline: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: IAppraisalPeriod, value: Date) {
          return value > this.submissionDeadline;
        },
        message: 'Review deadline must be after the submission deadline.',
      },
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook to ensure only one appraisal period is active.
 */
AppraisalPeriodSchema.pre<IAppraisalPeriod>('save', async function (next) {
  if (this.isActive) {
    // Deactivate all other periods
    await AppraisalPeriod.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

/**
 * Model for AppraisalPeriod.
 */
const AppraisalPeriod: Model<IAppraisalPeriod> = mongoose.model<IAppraisalPeriod>(
  'AppraisalPeriod',
  AppraisalPeriodSchema
);

export default AppraisalPeriod;
