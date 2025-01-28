import mongoose from 'mongoose';
import TimeEntry, { ITimeEntry } from '../models/TimeEntry';
import Shift, { IShift } from '../models/Shift';
import User from '../models/User';
import { PaginationMetadata } from '../types/paginate';

// -- Helper function to map employeeId (like "EMP-1234") to the actual ObjectId.
export const getEmployeeObjectId = async (employeeIdOrObjectId: string | mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> => {
  if (mongoose.Types.ObjectId.isValid(employeeIdOrObjectId)) {
    return new mongoose.Types.ObjectId(employeeIdOrObjectId);
  }
  // Otherwise treat as custom employee code
  const user = await User.findOne({ employee_id: employeeIdOrObjectId }).select('_id');
  if (!user) throw new Error('Employee not found.');
  return user._id;
};

// -- Check overlapping time entries
export const checkTimeEntryConflict = async (
  employeeId: mongoose.Types.ObjectId,
  shiftId: mongoose.Types.ObjectId,
  clockIn: Date,
  clockOut?: Date
): Promise<boolean> => {
  const conflictQuery: any = {
    employee: employeeId,
    shift: shiftId,
    $or: [
      {
        clockIn: { $lte: clockOut || new Date() },
        clockOut: { $gte: clockIn },
      },
      {
        clockIn: { $gte: clockIn, $lte: clockOut || new Date() },
      },
    ],
  };

  const conflictingEntry = await TimeEntry.findOne(conflictQuery);
  return !!conflictingEntry;
};

// -- Create a new time entry (Clock-In)
export const createTimeEntry = async (
  employeeId: string,
  shiftId: string,
  clockIn: Date,
  clockOut?: Date
): Promise<ITimeEntry> => {
  const employeeObjectId = await getEmployeeObjectId(employeeId);

  if (clockOut) {
    const hasConflict = await checkTimeEntryConflict(
      employeeObjectId,
      new mongoose.Types.ObjectId(shiftId),
      clockIn,
      clockOut
    );
    if (hasConflict) {
      throw new Error('Time entry conflict detected. Overlapping clock in/out.');
    }
  }

  const timeEntry = new TimeEntry({
    employee: employeeObjectId,
    shift: new mongoose.Types.ObjectId(shiftId),
    clockIn,
    clockOut: clockOut || null,
    status: clockOut ? 'clockedOut' : 'clockedIn',
  });

  await timeEntry.save();
  return timeEntry;
};

// -- Update an existing time entry (often used for Clock-Out)
export const updateTimeEntry = async (
  timeEntryId: string,
  updates: Partial<ITimeEntry>
): Promise<ITimeEntry | null> => {
  const timeEntry = await TimeEntry.findById(timeEntryId).populate('shift');
  if (!timeEntry) throw new Error('Time entry not found.');

  const clockIn = updates.clockIn || timeEntry.clockIn;
  const clockOut = updates.clockOut || timeEntry.clockOut;

  if (timeEntry.shift && typeof timeEntry.shift !== 'string') {
    const shift = timeEntry.shift as IShift;

    // If shift has startTime/endTime, ensure we do not exceed boundaries
    if (shift.startTime && shift.endTime) {
      const shiftStart = new Date(shift.date);
      shiftStart.setHours(
        parseInt(shift.startTime.split(':')[0]),
        parseInt(shift.startTime.split(':')[1]),
        0,
        0
      );

      const shiftEnd = new Date(shift.date);
      shiftEnd.setHours(
        parseInt(shift.endTime.split(':')[0]),
        parseInt(shift.endTime.split(':')[1]),
        0,
        0
      );

      if (clockIn && clockIn < shiftStart) {
        throw new Error('Clock-In time cannot be before shift start time.');
      }
      
    }
  }

  // If we are clocking out, ensure a dailyNote is provided
  if (updates.status === 'clockedOut' && !updates.dailyNote) {
    throw new Error('A daily note is required before clocking out.');
  }

  // Merge updates
  Object.assign(timeEntry, updates);

  return timeEntry.save();
};

// -- Admin-specific update (optional).
export const updateTimeEntryAdmin = async (
  id: string,
  updates: Partial<ITimeEntry>,
  adminId: mongoose.Types.ObjectId
): Promise<ITimeEntry> => {
  const timeEntry = await TimeEntry.findById(id);
  if (!timeEntry) throw new Error('Time entry not found.');

  console.log(`Admin ${adminId} updating TimeEntry ${id}:`, updates);

  // Possibly enforce note here, etc.
  Object.assign(timeEntry, updates);
  return timeEntry.save();
};

// -- Paginated fetch for an employee
export const getTimeEntriesByEmployee = async (
  employeeId: string,
  page: number,
  limit: number
): Promise<{ data: ITimeEntry[]; pagination: PaginationMetadata }> => {
  const employeeObjectId = await getEmployeeObjectId(employeeId);

  const totalItems = await TimeEntry.countDocuments({ employee: employeeObjectId });
  const totalPages = Math.ceil(totalItems / limit);
  const skip = (page - 1) * limit;

  const data = await TimeEntry.find({ employee: employeeObjectId })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }) // Sort newest first
    .populate({
      path: 'shift',
      select: 'date startTime endTime shiftType',
    })
    .populate('employee', 'name')
    

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
    },
  };
};

// -- Paginated fetch by shift
export const getTimeEntriesByShift = async (
  shiftId: string,
  page: number,
  limit: number
): Promise<{ data: ITimeEntry[]; pagination: PaginationMetadata }> => {
  const query = { shift: new mongoose.Types.ObjectId(shiftId) };

  const totalItems = await TimeEntry.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit);
  const skip = (page - 1) * limit;

  const data = await TimeEntry.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate({
      path: 'shift',
      select: 'date startTime endTime shiftType',
    })
    .populate('employee', 'name email')
   

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
    },
  };
};

// -- Paginated fetch by pay period
export const getTimeEntriesByPayPeriod = async (
  payPeriodId: string,
  page: number,
  limit: number
): Promise<{ data: ITimeEntry[]; pagination: PaginationMetadata }> => {
  const shifts = await Shift.find({ payPeriod: payPeriodId }).select('_id').lean();
  const shiftIds = shifts.map((shift) => shift._id);

  const totalItems = await TimeEntry.countDocuments({ shift: { $in: shiftIds } });
  const totalPages = Math.ceil(totalItems / limit);
  const skip = (page - 1) * limit;

  const data = await TimeEntry.find({ shift: { $in: shiftIds } })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate({
      path: 'shift',
      select: 'date startTime endTime shiftType',
    })
    .populate('employee', 'name email')
   

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
    },
  };
};

// -- Delete
export const deleteTimeEntry = async (id: string): Promise<void> => {
  await TimeEntry.findByIdAndDelete(id);
};

// -- Start Break
export const startBreak = async (timeEntryId: string): Promise<ITimeEntry> => {
  const timeEntry = await TimeEntry.findById(timeEntryId);
  if (!timeEntry) throw new Error('TimeEntry not found.');
  if (timeEntry.status === 'onBreak') throw new Error('You are already on a break.');
  if (timeEntry.status !== 'clockedIn') throw new Error('Cannot start a break if not clocked in.');

  timeEntry.breaks.push({ breakStart: new Date(), breakEnd: null });
  timeEntry.status = 'onBreak';
  return timeEntry.save();
};

// -- End Break
export const endBreak = async (timeEntryId: string): Promise<ITimeEntry> => {
  const timeEntry = await TimeEntry.findById(timeEntryId);
  if (!timeEntry) throw new Error('TimeEntry not found.');
  if (timeEntry.status !== 'onBreak') throw new Error('Not currently on a break.');

  const activeBreak = timeEntry.breaks.find((b) => !b.breakEnd);
  if (!activeBreak) throw new Error('No active break to end.');

  activeBreak.breakEnd = new Date();
  timeEntry.status = 'clockedIn';
  return timeEntry.save();
};

// -- Mark as Absent
export const markAsAbsent = async (
  employeeId: string,
  shiftId: string,
  reason: string
): Promise<ITimeEntry> => {
  const employeeObjectId = await getEmployeeObjectId(employeeId);

  // Prevent double absent
  const existingAbsence = await TimeEntry.findOne({
    employee: employeeObjectId,
    shift: new mongoose.Types.ObjectId(shiftId),
    status: 'absent',
  });
  if (existingAbsence) {
    throw new Error('This shift is already marked as absent.');
  }

  const timeEntry = new TimeEntry({
    employee: employeeObjectId,
    shift: new mongoose.Types.ObjectId(shiftId),
    clockIn: null,
    clockOut: null,
    reasonForAbsence: reason,
    status: 'absent',
  });

  await timeEntry.save();
  return timeEntry;
};

// -- Resume from break
export const resumeTimeEntry = async (
  employeeId: string,
  shiftId: string,
  clockIn: Date
): Promise<ITimeEntry> => {
  const employeeObjectId = await getEmployeeObjectId(employeeId);
  // Resume only if the status is "onBreak"
  const existingEntry = await TimeEntry.findOne({
    employee: employeeObjectId,
    shift: new mongoose.Types.ObjectId(shiftId),
    status: 'onBreak',
  });
  if (!existingEntry) {
    throw new Error('No active break entry found to resume.');
  }

  existingEntry.clockIn = clockIn;
  existingEntry.status = 'clockedIn';
  return existingEntry.save();
};
