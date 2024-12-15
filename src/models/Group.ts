// src/models/Group.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

export interface IGroup extends Document {
  name: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  content?: string;
  timestamp?: Date;
}

const GroupSchema: Schema<IGroup> = new Schema(
  {
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Corrected
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Corrected
  },
  { timestamps: true }
);

const Group: Model<IGroup> = mongoose.model<IGroup>('Group', GroupSchema);
export default Group;
