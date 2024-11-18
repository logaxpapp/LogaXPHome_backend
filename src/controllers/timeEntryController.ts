import { Request, Response } from 'express';
import {
  createTimeEntry,
  updateTimeEntry,
  getTimeEntriesByEmployee,
  getTimeEntriesByShift,
  getTimeEntriesByPayPeriod,
  deleteTimeEntry,
    startBreak,
    endBreak,
    markAsAbsent,
    resumeTimeEntry,
    getEmployeeObjectId,
    updateTimeEntryAdmin
} from '../services/timeEntryService';
import { IShift } from '../models/Shift';
import Shift from '../models/Shift';
import User from '../models/User';
import mongoose from'mongoose';
import { ShiftTypeName, IShiftType } from '../models/ShiftType';
import { checkActiveShift, createTemporaryShift } from '../services/shiftService';
import TimeEntry from '../models/TimeEntry';


export const clockInController = async (req: Request, res: Response) => {
  try {
    console.log('Request Body:', req.body);
    const { clockIn, shiftId } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

    if (!userId || !clockIn) {
      console.error('User ID or Clock-In time is missing.');
      res.status(400).json({ message: 'User ID and Clock-In time are required.' });
      return;
    }

    // **1. Check if the user is already clocked in**
    const activeTimeEntry = await TimeEntry.findOne({
      employee: userId,
      status: 'clockedIn',
    });

    if (activeTimeEntry) {
      console.log('User is already clocked in:', activeTimeEntry);
      res.status(400).json({ message: 'User is already clocked in.' });
      return;
    }

    // **2. Validate or create the active shift**
    let activeShift: IShift | null = null;

    if (shiftId) {
      console.log('Validating provided Shift ID:', shiftId);
      activeShift = await Shift.findById(shiftId).lean<IShift>();
      if (!activeShift) {
        console.error('Invalid Shift ID provided:', shiftId);
        res.status(400).json({ message: 'Invalid Shift ID provided.' });
        return;
      }
    } else {
      console.log('No Shift ID provided. Checking for active shifts or creating a temporary shift...');
      activeShift = await checkActiveShift(userId.toString());

      if (!activeShift) {
        console.log('No active shift found. Creating a temporary shift...');
        activeShift = await createTemporaryShift(userId.toString(), new Date(clockIn));
      }
    }

    if (!activeShift || !activeShift._id) {
      console.error('Failed to retrieve or create an active shift.');
      res.status(500).json({ message: 'Failed to retrieve or create an active shift.' });
      return;
    }

    console.log('Active shift for clock-in:', activeShift);

    // **3. Check for existing "clockedOut" or "onBreak" entries to resume**
    const existingEntry = await TimeEntry.findOne({
      employee: userId,
      shift: activeShift._id,
      $or: [{ status: 'clockedOut' }, { status: 'onBreak' }],
    });

    let timeEntry;
    if (existingEntry && existingEntry.status === 'onBreak') {
      console.log('Resuming time entry from break:', existingEntry);
      timeEntry = await resumeTimeEntry(userId.toString(), activeShift._id.toString(), new Date(clockIn));
    } else {
      console.log('Creating new time entry for clock-in.');
      timeEntry = await createTimeEntry(userId.toString(), activeShift._id.toString(), new Date(clockIn));
    }

    res.status(201).json(timeEntry);
  } catch (error: any) {
    console.error('Clock-In Error:', error.message);
    res.status(400).json({ message: error.message || 'Failed to clock in.' });
  }
};

export const clockOutController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Time entry ID
    const { clockOut } = req.body;

    if (!id || !clockOut) {
      res.status(400).json({ message: 'Time entry ID and Clock-Out time are required.' });
      return;
    }

    // Find the time entry
    const timeEntry = await TimeEntry.findById(id).populate({
      path: 'shift',
      populate: {
        path: 'shiftType',
        model: 'ShiftType', // Reference the ShiftType model
      },
    });

    if (!timeEntry) {
      res.status(404).json({ message: 'Time entry not found.' });
      return;
    }

    // Ensure the user is currently clocked in
    if (timeEntry.status !== 'clockedIn') {
      res.status(400).json({ message: 'Cannot clock out when not currently clocked in.' });
      return;
    }

    // Ensure `clockIn` is defined
    if (!timeEntry.clockIn) {
      res.status(400).json({ message: 'Clock-In time is missing for this time entry.' });
      return;
    }

    // Validate that the clock-out time is after clock-in time
    const clockOutTime = new Date(clockOut);
    if (clockOutTime <= timeEntry.clockIn) {
      res.status(400).json({ message: 'Clock-Out time must be after Clock-In time.' });
      return;
    }

    // Update the time entry
    timeEntry.clockOut = clockOutTime;
    timeEntry.status = 'clockedOut';
    timeEntry.hoursWorked = (clockOutTime.getTime() - timeEntry.clockIn.getTime()) / (1000 * 60 * 60); // Calculate hours worked

    await timeEntry.save();

    res.status(200).json({ message: 'Clock-Out successful', timeEntry });
  } catch (error: any) {
    console.error('Clock-Out Error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to clock out.' });
  }
};


export const updateTimeEntryAdminController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Time entry ID
    const updates = req.body; // Fields to update
    const adminId = req.user?._id as mongoose.Types.ObjectId; // Admin's ID

    if (!id || !adminId) {
      res.status(400).json({ message: 'Time entry ID and admin ID are required.' });
      return;
    }

    // Perform the update
    const updatedEntry = await updateTimeEntryAdmin(id, updates, adminId);

    res.status(200).json(updatedEntry);
  } catch (error: any) {
    console.error('Admin Update Error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to update time entry.' });
  }
};



// Get TimeEntries for a specific employee with pagination
 const getTimeEntriesByEmployeeController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (!employeeId || typeof employeeId !== 'string') {
      throw new Error('Invalid or missing employeeId parameter.');
    }

    const timeEntries = await getTimeEntriesByEmployee(employeeId, page, limit);
    res.status(200).json(timeEntries);
  } catch (error: any) {
    console.error('Error fetching time entries by employee:', error.message);
    res.status(400).json({ message: error.message || 'Failed to fetch time entries.' });
  }
};

// Get TimeEntries for a specific shift with pagination
 const getTimeEntriesByShiftController = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const timeEntries = await getTimeEntriesByShift(shiftId, page, limit);
    res.status(200).json(timeEntries);
  } catch (error: any) {
    console.error('Error fetching time entries by shift:', error.message);
    res.status(400).json({ message: error.message || 'Failed to fetch time entries.' });
  }
};



// Get TimeEntries for a specific pay period
 const getTimeEntriesByPayPeriodController = async (req: Request, res: Response) => {
  try {
    const { payPeriodId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const timeEntries = await getTimeEntriesByPayPeriod(payPeriodId, page, limit);

    res.status(200).json(timeEntries);
  } catch (error: any) {
    console.error('Error fetching time entries by pay period:', error.message);
    res.status(400).json({ message: error.message || 'Failed to fetch time entries.' });
  }
};


// Delete a TimeEntry
 const deleteTimeEntryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteTimeEntry(id);
    res.status(200).json({ message: 'TimeEntry deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete time entry.' });
  }
};


// Start Break
 const startBreakController = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      const updatedEntry = await startBreak(id);
      res.status(200).json(updatedEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to start break.' });
    }
  };
  
  // End Break
  const endBreakController = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      const updatedEntry = await endBreak(id);
      res.status(200).json(updatedEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to end break.' });
    }
  };
  
  // Mark as Absent
  const markAsAbsentController = async (req: Request, res: Response) => {
    try {
      const { employeeId, shiftId, reason } = req.body;
  
      const timeEntry = await markAsAbsent(employeeId, shiftId, reason);
      res.status(201).json(timeEntry);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to mark as absent.' });
    }
  };

  
  const fetchAbsencesController = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
  
      // Convert employeeId (e.g., "EMP-1761") to ObjectId
      const employeeObjectId = await getEmployeeObjectId(employeeId);
  
      // Fetch absences where status is 'absent'
      const absences = await TimeEntry.find({ employee: employeeObjectId, status: 'absent' })
        .select('reasonForAbsence createdAt') // Select relevant fields
        .lean();
  
      res.status(200).json(absences);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch absences.' });
    }
  };
  
  export const fetchCurrentStatusController = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
  
      // Fetch User by `employee_id` to get `_id`
      const user = await User.findOne({ employee_id: employeeId }).select('_id');
      if (!user) {
        res.status(404).json({ message: 'Employee not found.' });
        return;
      }
      const employeeObjectId = user._id;
  
      // Fetch the latest TimeEntry for the employee
      const timeEntry = await TimeEntry.findOne({ employee: employeeObjectId })
        .sort({ clockIn: -1 }) // Sort to get the most recent entry
        .populate('shift', 'date startTime endTime')
        .lean();
  
      if (!timeEntry) {
        res.status(404).json({ message: 'No time entry found for this employee.' });
        return;
      }
  
      // Include the `timeEntryId` in the response
      const currentStatus = {
        currentStatus: timeEntry.status,
        timeEntryId: timeEntry._id, 
        shift: timeEntry.shift,
        break: timeEntry.breaks?.find((b) => !b.breakEnd) || null, // Active break
      };
  
      res.status(200).json(currentStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch current status.' });
    }
  };
  
  export {

    getTimeEntriesByEmployeeController,
    getTimeEntriesByShiftController,
    getTimeEntriesByPayPeriodController,
    deleteTimeEntryController,
    startBreakController,
    endBreakController,
    markAsAbsentController,
    fetchAbsencesController,
    
  };
  
  