import TimeEntry from '../models/TimeEntry';
import Shift from '../models/Shift';
import User from '../models/User';
import { IShift } from '../models/Shift';
import { ITimeEntry } from '../models/TimeEntry';
import mongoose from 'mongoose';
import { paginateQuery } from '../utils/paginateQuery';
import  {  PaginationMetadata } from '../types/paginate';

// Helper: Map `employeeId` to `_id`
// Map `employeeId` to `_id`
// Updated Helper: Map `employeeId` or `_id` to ObjectId
export const getEmployeeObjectId = async (employeeIdOrObjectId: string | mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> => {
  console.log('Resolving employee ID or ObjectId:', employeeIdOrObjectId);

  // If already a valid ObjectId, return it directly
  if (mongoose.Types.ObjectId.isValid(employeeIdOrObjectId)) {
    console.log('Provided ID is already a valid ObjectId:', employeeIdOrObjectId);
    return new mongoose.Types.ObjectId(employeeIdOrObjectId);
  }

  // Otherwise, resolve it via `employee_id`
  const user = await User.findOne({ employee_id: employeeIdOrObjectId }).select('_id');
  if (!user) {
    console.error('No user found for Employee ID:', employeeIdOrObjectId);
    throw new Error('Employee not found.');
  }

  console.log('Resolved ObjectId from employee_id:', user._id);
  return user._id;
};


  // Check for overlapping time entries
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

  // Clock in Service

  export const createTimeEntry = async (
    employeeId: string,
    shiftId: string,
    clockIn: Date,
    clockOut?: Date // Optional
  ): Promise<ITimeEntry> => {
    console.log('Creating Time Entry for Employee ID:', employeeId);
  
    const employeeObjectId = await getEmployeeObjectId(employeeId);
    console.log('Resolved Employee ObjectId:', employeeObjectId);
  
    // Only check for conflicts if clockOut is provided
    if (clockOut) {
      const hasConflict = await checkTimeEntryConflict(
        employeeObjectId,
        new mongoose.Types.ObjectId(shiftId),
        clockIn,
        clockOut
      );
  
      if (hasConflict) {
        console.error('Time entry conflict detected');
        throw new Error('Time entry conflict detected. Clock-in/out times overlap with another entry.');
      }
    }
  
    const timeEntry = new TimeEntry({
      employee: employeeObjectId,
      shift: new mongoose.Types.ObjectId(shiftId),
      clockIn,
      clockOut: clockOut || null, // Default to null if not provided
      status: clockOut ? 'clockedOut' : 'clockedIn',
    });
  
    await timeEntry.save();
    console.log('Time Entry Created:', timeEntry);
    return timeEntry;
  };
  
  
  
// Update a TimeEntry
export const updateTimeEntry = async (
  id: string,
  updates: Partial<ITimeEntry>
): Promise<ITimeEntry | null> => {
  const timeEntry = await TimeEntry.findById(id).populate('shift');
  if (!timeEntry) throw new Error('Time entry not found.');

  const clockIn = updates.clockIn || timeEntry.clockIn;
  const clockOut = updates.clockOut || timeEntry.clockOut;

  // Add validation to ensure clockIn is defined before comparing
  if (clockIn && clockOut && clockIn >= clockOut) {
    throw new Error('Clock-In time must be before Clock-Out time.');
  }

  // Validate against shift boundaries
  if (timeEntry.shift && typeof timeEntry.shift !== 'string') {
    const shift = timeEntry.shift as IShift;

    if (shift.startTime && shift.endTime) {
      const shiftStart = new Date(shift.date);
      shiftStart.setHours(parseInt(shift.startTime.split(':')[0]), parseInt(shift.startTime.split(':')[1]));

      const shiftEnd = new Date(shift.date);
      shiftEnd.setHours(parseInt(shift.endTime.split(':')[0]), parseInt(shift.endTime.split(':')[1]));

      if (clockIn && clockIn < shiftStart) {
        throw new Error('Clock-In time cannot be before shift start time.');
      }
      if (clockOut && clockOut > shiftEnd) {
        throw new Error('Clock-Out time cannot be after shift end time.');
      }
    }
  }

  if (clockIn && clockOut) {
    timeEntry.hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  }

  Object.assign(timeEntry, updates);
  return timeEntry.save();
};

export const updateTimeEntryAdmin = async (
  id: string,
  updates: Partial<ITimeEntry>,
  adminId: mongoose.Types.ObjectId // Track the admin making the change
): Promise<ITimeEntry> => {
  const timeEntry = await TimeEntry.findById(id);
  if (!timeEntry) {
    throw new Error('Time entry not found.');
  }

  // Log changes for audit purposes
  console.log(`Admin ${adminId} is updating TimeEntry ${id}:`, updates);

  // Apply updates
  Object.assign(timeEntry, updates);

  // Save changes
  return timeEntry.save();
};



// Fetch all TimeEntries for a specific employee with pagination
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
    .populate({
      path: 'shift',
      select: 'date startTime endTime shiftType',
      populate: {
        path: 'shiftType',
        select: 'name description',
      },
    })
    .populate('employee', 'name')
    .lean<ITimeEntry[]>();

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
    },
  };
};

// Fetch all TimeEntries for a specific shift with pagination
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
    .populate({
      path: 'shift',
      select: 'date startTime endTime shiftType',
      populate: {
        path: 'shiftType',
        select: 'name description',
      },
    })
    .populate('employee', 'name email')
    .lean<ITimeEntry[]>();

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
    },
  };
};



// Fetch TimeEntries for a specific pay period
export const getTimeEntriesByPayPeriod = async (
  payPeriodId: string,
  page: number,
  limit: number
): Promise<{ data: ITimeEntry[]; pagination: PaginationMetadata }> => {
  const shifts = await Shift.find({ payPeriod: payPeriodId }).select('_id').lean();
  const shiftIds = shifts.map((shift) => shift._id);

  return paginateQuery(
    TimeEntry,
    { shift: { $in: shiftIds } },
    page,
    limit,
    [
      {
        path: 'shift',
        select: 'date startTime endTime shiftType',
        populate: {
          path: 'shiftType',
          select: 'name description',
        },
      },
      { path: 'employee', select: 'name email' },
    ]
  );
};



// Delete a TimeEntry
export const deleteTimeEntry = async (id: string): Promise<void> => {
  await TimeEntry.findByIdAndDelete(id);
};


// Start a Break
export const startBreak = async (timeEntryId: string): Promise<ITimeEntry> => {
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) throw new Error('TimeEntry not found.');
    if (timeEntry.status === 'onBreak') throw new Error('Break already started.');
    if (timeEntry.status !== 'clockedIn') throw new Error('Cannot start a break when not clocked in.');
  
    timeEntry.breaks.push({ breakStart: new Date(), breakEnd: null });
    timeEntry.status = 'onBreak';
    return timeEntry.save();
  };
  

  
  // End a Break
  export const endBreak = async (timeEntryId: string): Promise<ITimeEntry> => {
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) throw new Error('TimeEntry not found.');
    if (timeEntry.status !== 'onBreak') throw new Error('Cannot end a break when not on break.');
  
    const activeBreak = timeEntry.breaks.find((b) => !b.breakEnd);
    if (!activeBreak) throw new Error('No active break to end.');
  
    activeBreak.breakEnd = new Date();
    timeEntry.status = 'clockedIn';
    return timeEntry.save();
  };
  
  // Mark as Absent
  export const markAsAbsent = async (
    employeeId: string,
    shiftId: string,
    reason: string
  ): Promise<ITimeEntry> => {
    const employeeObjectId = await getEmployeeObjectId(employeeId);
  
    // Check if a TimeEntry already exists for this shift with 'absent' status
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
  
  

  export const resumeTimeEntry = async (
    employeeId: string,
    shiftId: string,
    clockIn: Date
  ): Promise<ITimeEntry> => {
    const employeeObjectId = await getEmployeeObjectId(employeeId);
  
    // Check for an existing "onBreak" entry
    const existingEntry = await TimeEntry.findOne({
      employee: employeeObjectId,
      shift: new mongoose.Types.ObjectId(shiftId),
      status: 'onBreak', // Only allow resumption if the status is 'onBreak'
    });
  
    if (!existingEntry) {
      throw new Error('No active break entry found. Resumption is not possible.');
    }
  
    // Resume the time entry by updating the clock-in time and status
    existingEntry.clockIn = new Date(clockIn); // Update the clock-in time
    existingEntry.status = 'clockedIn'; // Set status back to 'clockedIn'
    await existingEntry.save();
  
    return existingEntry;
  };
  