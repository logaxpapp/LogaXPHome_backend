import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IGroup } from './Group';

export interface IGroupMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId | IUser;
  groupId: mongoose.Types.ObjectId | IGroup;
  timestamp: Date;
}

const GroupMessageSchema: Schema<IGroupMessage> = new Schema(
  {
    content: { type: String, required: true },
    sender: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Types.ObjectId, ref: 'Group', required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model<IGroupMessage>(
  'GroupMessage',
  GroupMessageSchema
);
export default GroupMessage;
