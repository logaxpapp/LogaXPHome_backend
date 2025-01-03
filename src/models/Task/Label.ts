// src/models/Label.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILabel extends Document {
  name: string;
  color: string; // e.g., '#FF5733'
  board: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LabelSchema: Schema<ILabel> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  },
  { timestamps: true }
);

const Label: Model<ILabel> = mongoose.model<ILabel>('Label', LabelSchema);
export default Label;
