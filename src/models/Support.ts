import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITicket extends Document {
  subject: string;
  description: string;
  status: 'Open' | 'Resolved' | 'Pending' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[];
  ticketNumber: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFAQ extends Document {
  question: string;
  answer: string;
}

const SupportTicketSchema: Schema<ITicket> = new Schema(
  {
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Resolved', 'Pending', 'Closed'], default: 'Open' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    tags: { type: [String], default: [] }, // Array of strings for tagging tickets
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const FAQSchema: Schema<IFAQ> = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

export const SupportTicket: Model<ITicket> = mongoose.model<ITicket>('SupportTicket', SupportTicketSchema);
export const FAQ: Model<IFAQ> = mongoose.model<IFAQ>('FAQ', FAQSchema);
