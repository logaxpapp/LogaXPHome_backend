import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';
import { IShift } from './Shift';

export interface ITimeEntry extends Document {
  employee: mongoose.Types.ObjectId | IUser;
  shift: mongoose.Types.ObjectId | IShift;
  clockIn?: Date; 
  clockOut?: Date | null;
  breaks: {
    breakStart: Date;
    breakEnd: Date | null;
  }[];
  totalBreakTime: number;
  hoursWorked: number;
  status: 'clockedIn' | 'onBreak' | 'clockedOut' | 'absent'; 
  reasonForAbsence?: string;
  dailyNote?: string;    // <<-- New Field for staff’s daily note
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema: Schema<ITimeEntry> = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    clockIn: { type: Date },
    clockOut: { type: Date, default: null },
    breaks: [
      {
        breakStart: { type: Date, required: true },
        breakEnd: { type: Date, default: null },
      },
    ],
    totalBreakTime: { type: Number, default: 0 },
    hoursWorked: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['clockedIn', 'onBreak', 'clockedOut', 'absent'],
      required: true,
    },
    reasonForAbsence: { type: String, default: null },
    dailyNote: { type: String, default: '' },   // Not strictly required in DB, 
                                                // but we'll enforce at controller
  },
  { timestamps: true }
);

const roundToNearest = (minutes: number, interval: number): number => {
  return Math.round(minutes / interval) * interval;
};

// 1) Validate clockIn / clockOut ordering
TimeEntrySchema.pre('validate', function (next) {
  if (this.status === 'absent') {
    this.clockIn = undefined;
    this.clockOut = undefined;
  } else if (this.clockIn && this.clockOut && this.clockIn >= this.clockOut) {
    return next(new Error('Clock-out time must be after clock-in time.'));
  }
  next();
});

// 2) Auto-calculate hoursWorked for clocked-in/out statuses
TimeEntrySchema.pre('save', function (next) {
  if (this.status !== 'absent' && this.clockIn && this.clockOut) {
    const workMinutes = (this.clockOut.getTime() - this.clockIn.getTime()) / (1000 * 60);
    const effectiveMinutes = workMinutes - this.totalBreakTime;
    const roundedMinutes = roundToNearest(effectiveMinutes, 15); // Round to nearest 15
    this.hoursWorked = roundedMinutes / 60;
  }
  next();
});

// 3) Calculate totalBreakTime
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
