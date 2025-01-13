// src/models/Attachment.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { ICard } from './Card';
import { IUser } from '../User';

export interface IAttachment extends Document {
  _id: mongoose.Types.ObjectId;
  card: mongoose.Types.ObjectId | ICard;
  uploader: mongoose.Types.ObjectId | IUser;
  filename: string;
  url: string;
  key: string; // S3 key
  uploadedAt: Date;
}

const AttachmentSchema: Schema<IAttachment> = new Schema(
  {
    card: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true }, // URL to access the attachment
    key: { type: String, required: true }, // S3 key
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

const Attachment: Model<IAttachment> = mongoose.model<IAttachment>('Attachment', AttachmentSchema);
export default Attachment;
