// src/models/Notification.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

export interface INotification extends Document {
  type: string;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId | IUser; 
  data?: any;
  read: boolean;
  timestamp: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: { type: String, required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);