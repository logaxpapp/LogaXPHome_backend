// src/models/Task/Report.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { ReportType } from '../../types/report';
import { IUser } from '../User';
import { IBoard } from './Board'; // If you have an IBoard interface

export interface IReport extends Document {
  reportType: ReportType;
  filters: Record<string, any>;
  generatedBy: mongoose.Types.ObjectId | IUser;
  generatedAt: Date;
  data: any;
  title?: string;
  board: mongoose.Types.ObjectId | IBoard; // <--- NEW
}

const ReportSchema: Schema<IReport> = new Schema(
  {
    reportType: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
    },
    filters: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    title: { type: String },

    // NEW: Reference to the board this report belongs to
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
  },
  { timestamps: true }
);

ReportSchema.index({ reportType: 1, generatedAt: -1 });
ReportSchema.index({ generatedBy: 1, generatedAt: -1 });

// If you want quick lookups by board, add:
ReportSchema.index({ board: 1, generatedAt: -1 });

const Report: Model<IReport> = mongoose.model<IReport>('Report', ReportSchema);
export default Report;
