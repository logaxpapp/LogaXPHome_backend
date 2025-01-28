// src/models/Task/Card.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; // Import UUID

/**
 * Sub-Task Interface
 */
export interface ISubTask {
  id?: string; // Unique identifier
  title: string;
  completed: boolean;
  dueDate?: Date;
  assignee?: mongoose.Types.ObjectId;
}

/**
 * Time Log Interface
 */
export interface ITimeLog {
  id: string; // Unique identifier
  user: mongoose.Types.ObjectId;
  start: Date;
  end?: Date;
  duration?: number; // in minutes
}

/**
 * Custom Field Interface
 */
export interface ICustomField {
    id: string; // Unique identifier
    key: string;
    value: string;
  }

  interface IStatusHistory {
    status: string;
    from: Date;
    to: Date;
  }
  

/**
 * Card (Task) Interface
 */
export interface ICard extends Document {
  _id: mongoose.Types.ObjectId | string; 
  title: string;
  description?: string;
  list: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  labels: mongoose.Types.ObjectId[];
  attachments: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  position: number;
  startDate?: Date;   // <--- Distinct from createdAt
  dueDate?: Date;     // already present, used for end date
  progress: number;  // 0 to 100
  dependencies?: string[];
  statusHistory?: IStatusHistory[];

  // Sub-Documents with IDs
  subTasks?: ISubTask[];
  timeLogs?: ITimeLog[];
  customFields?: ICustomField[];

  // Additional Fields
  status: string; // e.g., "To Do", "In Progress", "Done"
  priority: string; // e.g., "Low", "Medium", "High"
  likes: mongoose.Types.ObjectId[]; // Users who liked the card
  watchers: mongoose.Types.ObjectId[]; // Users watching the card

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sub-Task Subschema
 */
const SubTaskSchema: Schema<ISubTask> = new Schema(
  {
    id: { type: String, default: uuidv4 }, // Generate unique ID
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

/**
 * Time Log Subschema
 */
const TimeLogSchema: Schema<ITimeLog> = new Schema(
  {
    id: { type: String, default: uuidv4 }, // Generate unique ID
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start: { type: Date, required: true },
    end: { type: Date },
    duration: { type: Number }, // in minutes
  },
  { _id: false }
);

/**
 * Custom Field Subschema
 */
const CustomFieldSchema: Schema<ICustomField> = new Schema(
  {
    id: { type: String, default: uuidv4 }, // Generate unique ID
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Status History Subschema
 */
const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

/**
 * Card Schema
 */
const CardSchema: Schema<ICard> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    labels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Label' }],
    startDate: { type: Date },
    dueDate: { type: Date },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    position: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    dependencies: [{ type: String }],

    // Subdocument arrays
    subTasks: [SubTaskSchema],
    timeLogs: [TimeLogSchema],
    customFields: [CustomFieldSchema],
    statusHistory: [StatusHistorySchema],

    // Additional Fields
    status: { type: String, default: 'Backlog' }, // Default status
    priority: { type: String, default: 'Medium' }, // Default priority
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Card: Model<ICard> = mongoose.model<ICard>('Card', CardSchema);
export default Card;
