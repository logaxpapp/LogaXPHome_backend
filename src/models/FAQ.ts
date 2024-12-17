import mongoose, { Schema, Document } from 'mongoose';
import { Application } from '../types/enums';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  application: Application; // Enum type
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const FAQSchema: Schema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    application: {
      type: String,
      enum: Object.values(Application), // Use the Application enum
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const FAQ = mongoose.model<IFAQ>('FAQ', FAQSchema);
export default FAQ;
