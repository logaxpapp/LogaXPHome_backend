// src/models/Message.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';
import { IGroup } from './Group';

export interface IMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId | IUser;
  receiver?: mongoose.Types.ObjectId | IUser; // Optional for group messages
  groupId?: mongoose.Types.ObjectId | IGroup; // Optional for private messages
  timestamp: Date;
  read: boolean;
  fileUrl?: string; // Optional
  readBy: mongoose.Types.ObjectId[]; // Users who have read the message
  reactions: {
    user: mongoose.Types.ObjectId | IUser;
    emoji: string;
  }[];
  edited: boolean;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    content: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User' }, // For private messages
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' }, // For group messages
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    fileUrl: { type: String },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String },
      },
    ],
    edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for performance optimization
MessageSchema.index({ sender: 1, receiver: 1, groupId: 1, timestamp: -1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
