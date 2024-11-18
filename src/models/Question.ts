// src/models/Question.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  question_text: string;
  question_type: 'Multiple Choice' | 'Text' | 'Rating' | 'Checkbox';
  options?: string[];
}

const QuestionSchema: Schema = new Schema({
  question_text: { type: String, required: true },
  question_type: { type: String, enum: ['Multiple Choice', 'Text', 'Rating', 'Checkbox'], required: true },
  options: [{ type: String }],
});

const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
export default Question;
