// src/models/ShareToken.ts

import mongoose, { Schema, Document, Model } from 'mongoose';
import { ApplicationType } from '../models/TestCase'; // or from a separate file if you have "APPLICATIONS" in a separate place

export interface IShareToken extends Document {
  token: string;               // random string (uuid)
  application: ApplicationType; // "GatherPlux", etc.
  createdBy?: mongoose.Types.ObjectId; 
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShareTokenSchema = new Schema<IShareToken>(
  {
    token: { type: String, required: true, unique: true },
    application: { type: String, required: true },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const ShareToken: Model<IShareToken> = mongoose.model<IShareToken>('ShareToken', ShareTokenSchema);
export default ShareToken;
