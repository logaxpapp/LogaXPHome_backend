// src/models/Task/Comment.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from '../User';
import { ICard } from './Card';

export interface IComment extends Document {
  card: mongoose.Types.ObjectId | ICard;
  author: mongoose.Types.ObjectId | IUser;
  content: string;
  parentComment?: mongoose.Types.ObjectId | IComment; // For replies
  likes: mongoose.Types.ObjectId[]; // Users who liked the comment
  mentions: mongoose.Types.ObjectId[]; // Users mentioned in the comment
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema(
  {
    card: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', CommentSchema);
export default Comment;
