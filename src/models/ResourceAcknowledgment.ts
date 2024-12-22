import mongoose, { Schema, Document } from 'mongoose';
import { IResource } from './Resource';

export interface IResourceAcknowledgment extends Document {
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId | IResource;
  acknowledgedAt: Date;
  signature?: string; // Stylized signature text
  font?: string;      // Font style
  size?: string;      // Font size
  color?: string;     // Font color
}

const ResourceAcknowledgmentSchema = new Schema<IResourceAcknowledgment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  acknowledgedAt: { type: Date, default: Date.now },
  signature: { type: String, trim: true },
  font: { type: String, trim: true },
  size: { type: String, trim: true },  // Save font size
  color: { type: String, trim: true }, // Save font color
});

export default mongoose.model<IResourceAcknowledgment>('ResourceAcknowledgment', ResourceAcknowledgmentSchema);
