import mongoose, { Document, Schema, Model } from 'mongoose';
import { IShiftType } from './ShiftType';
import { IUser } from './User'; // Assume User model exists
import { IPayPeriod } from './PayPeriod';

// Enum for Shift Status
export enum ShiftStatus {
  Open = 'Open',
  Assigned = 'Assigned',
  Excess = 'Excess',
  PendingApproval = 'Pending Approval', // Status for temporary shifts
  Rejected = 'Rejected', // Optional: For shifts denied during approval
}

// Interface for Shift
export interface IShift extends Document {
  shiftType?: mongoose.Types.ObjectId | IShiftType; // Optional for temporary shifts
  date: Date;
  startTime?: string; // Optional for temporary shifts
  endTime?: string;   // Optional for temporary shifts
  assignedTo?: mongoose.Types.ObjectId | IUser; // Employee assigned to this shift
  status: ShiftStatus;
  isExcess?: boolean; // Indicates if the shift is beyond required capacity
  createdBy: mongoose.Types.ObjectId | IUser; // The user who created the shift
  isTemporary?: boolean; // Flag to indicate if this is a temporary shift
  reason?: string; // Optional: Reason for temporary shift creation
  applicationManaged: string[]; // Aligns with user's applications_managed
  payPeriod?: mongoose.Types.ObjectId | IPayPeriod; // Reference to associated pay period
  createdAt: Date;
  updatedAt: Date;
}

// Shift Schema
const ShiftSchema: Schema<IShift> = new Schema(
  {
    shiftType: { type: Schema.Types.ObjectId, ref: 'ShiftType' }, // Optional for temporary shifts
    date: { type: Date, required: true },
    startTime: { type: String }, // Optional for temporary shifts
    endTime: { type: String },   // Optional for temporary shifts
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: Object.values(ShiftStatus),
      required: true,
      default: ShiftStatus.Open,
    },
    isExcess: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isTemporary: { type: Boolean, default: false }, // Marks temporary shifts
    reason: { type: String, default: null }, // Reason for temporary shift (optional)
    applicationManaged: [{ type: String, trim: true }],
    payPeriod: { type: Schema.Types.ObjectId, ref: 'PayPeriod', default: null }, // Optional pay period reference
  },
  { timestamps: true }
);

// Indexes for Faster Queries
ShiftSchema.index({ date: 1, shiftType: 1 });
ShiftSchema.index({ assignedTo: 1, date: 1 });
ShiftSchema.index({ payPeriod: 1 }); // Index for payPeriod queries

const Shift: Model<IShift> = mongoose.model<IShift>('Shift', ShiftSchema);

export default Shift;
