// src/models/ShiftType.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

// Enum for ShiftType Names
export enum ShiftTypeName {
  Morning = 'Morning',
  Afternoon = 'Afternoon',
  Night = 'Night',
  PRN = 'PRN',
  VOL = 'VOL',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
  TEMPSHIFT = 'TEMPSHIFT',
  
  // Add more as needed
}

// Interface for ShiftType
export interface IShiftType extends Document {
  _id: mongoose.Types.ObjectId; // Ensure _id is correctly typed
  name: ShiftTypeName;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ShiftType Schema
const ShiftTypeSchema: Schema<IShiftType> = new Schema(
  {
    name: { type: String, enum: Object.values(ShiftTypeName), required: true, unique: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

// Export ShiftType Model
const ShiftType: Model<IShiftType> = mongoose.model<IShiftType>('ShiftType', ShiftTypeSchema);
export default ShiftType;
