import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User'; 

export enum TicketPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

export enum TicketCategory {
  TechnicalIssue = 'Technical Issue',
  AccessRequest = 'Access Request',
  BugReport = 'Bug Report',
  FeatureRequest = 'Feature Request',
  GeneralInquiry = 'General Inquiry',
}

export enum TicketStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Open = 'Open',
  Critical = 'Critical',
}

export interface IComment extends Document {
  author: mongoose.Types.ObjectId | IUser;
  content: string;
  date: Date;
}

export interface IAttachment extends Document {
  filename: string;
  url: string;
  uploadedAt: Date;
}

export interface IActivityLog extends Document {
  action: string;
  performedBy: mongoose.Types.ObjectId | IUser;
  date: Date;
}

export interface ITicket extends Document {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  application: 'Loga Beauty' | 'GatherPlux' | 'TimeSync' | 'BookMiz';
  status: TicketStatus;
  assignedTo?: mongoose.Types.ObjectId | IUser;
  department: 'HR' | 'IT' | 'Sales' | 'Marketing' | 'Finance';
  date: Date;
  dueDate?: Date;
  tags: string[];
  watchers: (mongoose.Types.ObjectId | IUser)[];
  comments: IComment[];
  attachments: IAttachment[];
  activityLog: IActivityLog[];
  createdBy: mongoose.Types.ObjectId | IUser;
  updatedBy?: mongoose.Types.ObjectId | IUser;
  customFields: Map<string, any>;
}

const CommentSchema: Schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const AttachmentSchema: Schema = new Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const ActivityLogSchema: Schema = new Schema({
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
});

const TicketSchema: Schema<ITicket> = new Schema(
  {
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true },
    priority: { type: String, enum: Object.values(TicketPriority), required: true },
    category: { type: String, enum: Object.values(TicketCategory), required: true },
    application: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      required: true,
      default: TicketStatus.Pending,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    department: { type: String, required: true },
    date: { type: Date, default: Date.now },
    dueDate: { type: Date },
    tags: [{ type: String }],
    comments: [CommentSchema],
    attachments: [AttachmentSchema],
    activityLog: [ActivityLogSchema],
    watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

TicketSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Ticket: Model<ITicket> = mongoose.model<ITicket>('Ticket', TicketSchema);
export default Ticket;
