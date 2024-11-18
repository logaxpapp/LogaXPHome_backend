// src/models/ResourceAcknowledgment.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IResource } from './Resource';

export interface IResourceAcknowledgment extends Document {
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId | IResource; // Adjust here
  acknowledgedAt: Date;
}


const ResourceAcknowledgmentSchema = new Schema<IResourceAcknowledgment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  acknowledgedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IResourceAcknowledgment>('ResourceAcknowledgment', ResourceAcknowledgmentSchema);
