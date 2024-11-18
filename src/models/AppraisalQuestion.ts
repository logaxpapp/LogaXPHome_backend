// src/models/AppraisalQuestion.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Define possible question types
export type QuestionType = 'Rating' | 'Text' | 'Multiple Choice';

// Interface for AppraisalQuestion
export interface IAppraisalQuestion extends Document {
  question_text: string;
  question_type: QuestionType;
  options?: string[]; // For Multiple Choice questions
  appraisal_type?: string; // e.g., 'Annual', 'Mid-Year'
  period?: string; // e.g., 'Q1', 'Q2'
  created_at: Date;
  updated_at: Date;
}

// AppraisalQuestion Schema
const AppraisalQuestionSchema: Schema<IAppraisalQuestion> = new Schema(
  {
    question_text: { type: String, required: true, trim: true },
    question_type: { type: String, enum: ['Rating', 'Text', 'Multiple Choice'], required: true },
    options: {
      type: [String],
      required: function () {
        return this.question_type === 'Multiple Choice';
      },
    },
    appraisal_type: { type: String, trim: true },
    period: { type: String, trim: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Indexes for faster queries
AppraisalQuestionSchema.index({ appraisal_type: 1, period: 1 });

const AppraisalQuestion: Model<IAppraisalQuestion> = mongoose.model<IAppraisalQuestion>('AppraisalQuestion', AppraisalQuestionSchema);

export default AppraisalQuestion;
