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
  published: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const ApplicationFAQSchema: Schema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    application: {
      type: String,
      enum: Object.values(Application), 
      required: [true, 'Application is required'],
    },    
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    published: { type: Boolean, default: false },
  },
  { 
    timestamps: true,
    strict: true,
  }
);

// Prevent model overwrite by checking if it already exists
const ApplicationFAQ: Model<IFAQ> = mongoose.models.ApplicationFAQ || mongoose.model<IFAQ>('ApplicationFAQ', ApplicationFAQSchema);

export default ApplicationFAQ;
