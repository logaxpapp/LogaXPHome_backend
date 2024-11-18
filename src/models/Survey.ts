// src/models/Survey.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQuestion {
  _id?: mongoose.Types.ObjectId;
  question_text: string;
  question_type: 'Multiple Choice' | 'Text' | 'Rating' | 'Checkbox';
  options?: string[]; // Only for Multiple Choice or Checkbox types
}

export interface ISurvey extends Document {
  title: string;
  description?: string;
  questions: IQuestion[];
  created_by: mongoose.Types.ObjectId; // Reference to User who created the survey
  created_at: Date;
  updated_at: Date;
}

const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    question_text: { type: String, required: true },
    question_type: {
      type: String,
      enum: ['Multiple Choice', 'Text', 'Rating', 'Checkbox'],
      required: true,
    },
    options: [{ type: String }], // Optional for choice-based questions
  },
  { _id: true }
);

const SurveySchema: Schema<ISurvey> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    questions: { type: [QuestionSchema], required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const Survey: Model<ISurvey> = mongoose.model<ISurvey>('Survey', SurveySchema);
export default Survey;
