// src\models\TimeEntry.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';
import { IShift } from './Shift';


export interface ITimeEntry extends Document {
  employee: mongoose.Types.ObjectId | IUser;
  shift: mongoose.Types.ObjectId | IShift;
  clockIn?: Date; // Made optional to handle `absent` status
  clockOut?: Date | null;
  breaks: {
    breakStart: Date;
    breakEnd: Date | null;
  }[];
  totalBreakTime: number;
  hoursWorked: number;
  status: 'clockedIn' | 'onBreak' | 'clockedOut' | 'absent'; 
  reasonForAbsence?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema: Schema<ITimeEntry> = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    clockIn: { type: Date }, // Made optional
    clockOut: { type: Date, default: null },
    breaks: [
      {
        breakStart: { type: Date, required: true },
        breakEnd: { type: Date, default: null },
      },
    ],
    totalBreakTime: { type: Number, default: 0 }, // Break time in minutes
    hoursWorked: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['clockedIn', 'onBreak', 'clockedOut', 'absent'], // Added `absent`
      required: true,
    },
    reasonForAbsence: { type: String, default: null }, // Optional reason for absence
  },
  { timestamps: true }
);

const roundToNearest = (minutes: number, interval: number): number => {
  return Math.round(minutes / interval) * interval;
};

// Validation Middleware for clockIn and clockOut
TimeEntrySchema.pre('validate', function (next) {
  if (this.status === 'absent') {
    this.clockIn = undefined; // Ensure clockIn is not set for absent status
    this.clockOut = undefined; // Ensure clockOut is not set for absent status
  } else if (this.clockIn && this.clockOut && this.clockIn >= this.clockOut) {
    return next(new Error('Clock-out time must be after clock-in time.'));
  }
  next();
});

// Auto-calculate hoursWorked for clocked-in/out statuses
TimeEntrySchema.pre('save', function (next) {
  if (this.status !== 'absent' && this.clockIn && this.clockOut) {
    const workMinutes = (this.clockOut.getTime() - this.clockIn.getTime()) / (1000 * 60);
    const effectiveMinutes = workMinutes - this.totalBreakTime;
    const roundedMinutes = roundToNearest(effectiveMinutes, 15);
    this.hoursWorked = roundedMinutes / 60;
  }
  next();
});

// Middleware to calculate totalBreakTime
TimeEntrySchema.pre('save', function (next) {
  if (this.breaks && this.breaks.length > 0) {
    const breakMinutes = this.breaks.reduce((total, currentBreak) => {
      if (currentBreak.breakEnd) {
        return total + (currentBreak.breakEnd.getTime() - currentBreak.breakStart.getTime()) / (1000 * 60);
      }
      return total;
    }, 0);
    this.totalBreakTime = breakMinutes;
  }
  next();
});

const TimeEntry: Model<ITimeEntry> = mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);

export default TimeEntry;
