// src/models/FAQ.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export enum Application {
  DocSend = 'DocSend',
  TimeSync = 'TimeSync',
  TaskBrick = 'TaskBrick',
  Beautyhub = 'Beautyhub',
  BookMiz = 'BookMiz',
  GatherPlux = 'GatherPlux',
}

export interface IFAQ extends Document {
  question: string;
  answer: string;
  application: Application;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const FAQSchema: Schema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    application: {
      type: String,
      enum: Object.values(Application),
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent model overwrite by checking if it already exists
const FAQ: Model<IFAQ> = mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);

export default FAQ;
