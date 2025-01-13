// src/models/Task/Label.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILabel extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  color: string;
  board: mongoose.Types.ObjectId; // References the Board
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

// Adding index to board for performance
LabelSchema.index({ board: 1 });

const Label: Model<ILabel> = mongoose.model<ILabel>('Label', LabelSchema);
export default Label;
