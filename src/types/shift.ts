// src/types/shift.ts

import { IShiftType } from '../models/ShiftType';
import { IUser } from '../models/User';
import mongoose from 'mongoose';
import { ShiftStatus } from '../models/Shift';

// Define IShiftUnpopulated extending mongoose.Document to include _id
export interface IShiftUnpopulated extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  shiftType: mongoose.Types.ObjectId;
  date: Date;
  startTime: string; // Format: 'HH:MM' (24-hour)
  endTime: string;   // Format: 'HH:MM' (24-hour)
  assignedTo?: mongoose.Types.ObjectId;
  status: ShiftStatus;
  isExcess?: boolean;
  createdBy: mongoose.Types.ObjectId;
  applicationManaged: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Define IShiftPopulated for populated fields
export interface IShiftPopulated extends Omit<IShiftUnpopulated, 'shiftType' | 'assignedTo' | 'createdBy'> {
  shiftType: IShiftType;
  assignedTo?: IUser;
  createdBy: IUser;
}
