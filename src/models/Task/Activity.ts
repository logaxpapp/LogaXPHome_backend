// /src/models/Task/Activity.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from '../User';

export enum ActivityType {
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
  Commented = 'Commented',
  LikedComment = 'LikedComment',
  Moved = 'Moved',
  Edited = 'EDITED',
  Replied = 'REPLIED',
  // Add other activity types as needed
}

export interface IActivity extends Document {
  board?: mongoose.Types.ObjectId;
  list?: mongoose.Types.ObjectId;
  card?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId | IUser;
  type: ActivityType;
  details: string; 
  createdAt: Date;
}

const ActivitySchema: Schema<IActivity> = new Schema(
  {
    board: { type: Schema.Types.ObjectId, ref: 'Board' },
    list: { type: Schema.Types.ObjectId, ref: 'List' },
    card: { type: Schema.Types.ObjectId, ref: 'Card' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(ActivityType), required: true },
    details: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;
