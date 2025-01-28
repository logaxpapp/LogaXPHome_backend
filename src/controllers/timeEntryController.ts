import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TimeEntry from '../models/TimeEntry';
import Shift from '../models/Shift';
import User from '../models/User';
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
  updateTimeEntryAdmin
} from '../services/timeEntryService';
import { checkActiveShift, createTemporaryShift } from '../services/shiftService';

// ------------------- CLOCK IN -------------------
export const clockInController = async (req: Request, res: Response) => {
  try {
    const { clockIn, shiftId } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

    if (!userId) {
       res.status(400).json({ message: 'User ID is required.' });
       return;
    }
    if (!clockIn) {
      res.status(400).json({ message: 'Clock-In time is required.' });
      return;
    }

    // 1) Ensure user is not already clocked in
    const alreadyClockedIn = await TimeEntry.findOne({
      employee: userId,
      status: 'clockedIn',
    });
    if (alreadyClockedIn) {
       res.status(400).json({ message: 'You are already clocked in.' });
    }

    // 2) Validate or create the shift
    let activeShift = null;
    if (shiftId) {
      activeShift = await Shift.findById(shiftId);
      if (!activeShift) {
         res.status(400).json({ message: 'Invalid Shift ID provided.' });
          return;
      }
    } else {
      // Attempt to find if there's an active shift
      activeShift = await checkActiveShift(userId.toString());
      // If none, create a temporary shift
      if (!activeShift) {
        activeShift = await createTemporaryShift(userId.toString(), new Date(clockIn));
      }
    }

    if (!activeShift || !activeShift._id) {
       res.status(500).json({ message: 'Failed to find or create an active shift.' });
       return;
    }

    // 3) If user was "onBreak" for the same shift, resume. Otherwise, create fresh clockIn.
    const existingBreakEntry = await TimeEntry.findOne({
      employee: userId,
      shift: activeShift._id,
      status: 'onBreak',
    });
    let timeEntry;
    if (existingBreakEntry) {
      timeEntry = await resumeTimeEntry(userId.toString(), activeShift._id.toString(), new Date(clockIn));
    } else {
      timeEntry = await createTimeEntry(userId.toString(), activeShift._id.toString(), new Date(clockIn));
    }

     res.status(201).json(timeEntry);
     return;
  } catch (error: any) {
    console.error('Clock-In Error:', error.message);
     res.status(400).json({ message: error.message || 'Failed to clock in.' });
     return;
  }
};

// ------------------- CLOCK OUT -------------------
export const clockOutController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;     // TimeEntry ID
    const { clockOut, dailyNote } = req.body;

    if (!id) {
       res.status(400).json({ message: 'Time entry ID is required.' });
       return;
    }
    if (!clockOut) {
       res.status(400).json({ message: 'Clock-Out time is required.' });
       return;
    }
    if (!dailyNote || dailyNote.trim() === '') {
       res.status(400).json({ message: 'A daily note is required before clocking out.' });
       return;
    }

    // 1) Find the time entry
    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
       res.status(404).json({ message: 'Time entry not found.' });
       return;
    }

    // 2) Must be clockedIn to clockOut
    if (timeEntry.status !== 'clockedIn') {
       res.status(400).json({ message: 'You are not currently clocked in.' });
       return;
    }

    // 3) Perform update
    const updatedEntry = await updateTimeEntry(id, {
      clockOut: new Date(clockOut),
      status: 'clockedOut',
      dailyNote: dailyNote,   // Save the note
    });

     res.status(200).json({ message: 'Clock-Out successful', timeEntry: updatedEntry });
     return;
  } catch (error: any) {
    console.error('Clock-Out Error:', error.message);
     res.status(500).json({ message: error.message || 'Failed to clock out.' });
     return;
  }
};

// ------------------- ADMIN UPDATE -------------------
export const updateTimeEntryAdminController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const adminId = req.user?._id as mongoose.Types.ObjectId;

    if (!id || !adminId) {
       res.status(400).json({ message: 'Time entry ID and admin ID are required.' });
       return;
    }

    const updated = await updateTimeEntryAdmin(id, updates, adminId);
     res.status(200).json(updated);
     return;
  } catch (error: any) {
    console.error('Admin Update Error:', error.message);
     res.status(500).json({ message: error.message || 'Failed to update time entry.' });
      return;
  }
};

// ------------------- GET ENTRIES BY EMPLOYEE -------------------
export const getTimeEntriesByEmployeeController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const timeEntries = await getTimeEntriesByEmployee(employeeId, page, limit);
     res.status(200).json(timeEntries);
      return;
  } catch (error: any) {
    console.error('Error fetching time entries by employee:', error.message);
     res.status(400).json({ message: error.message || 'Failed to fetch time entries.' });
     return;
  }
};

// ------------------- GET ENTRIES BY SHIFT -------------------
export const getTimeEntriesByShiftController = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const timeEntries = await getTimeEntriesByShift(shiftId, page, limit);
     res.status(200).json(timeEntries);
      return;
  } catch (error: any) {
    console.error('Error fetching time entries by shift:', error.message);
    res.status(400).json({ message: error.message || 'Failed to fetch time entries.' });
      return;
  }
};

// ------------------- GET ENTRIES BY PAY PERIOD -------------------
export const getTimeEntriesByPayPeriodController = async (req: Request, res: Response) => {
  try {
    const { payPeriodId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const timeEntries = await getTimeEntriesByPayPeriod(payPeriodId, page, limit);
     res.status(200).json(timeEntries);
      return;
  } catch (error: any) {
    console.error('Error fetching time entries by pay period:', error.message);
     res.status(400).json({ message: error.message || 'Failed to fetch time entries.' });
     return;
  }
};

// ------------------- DELETE -------------------
export const deleteTimeEntryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteTimeEntry(id);
     res.status(200).json({ message: 'TimeEntry deleted successfully.' });
      return;
  } catch (error: any) {
     res.status(400).json({ message: error.message || 'Failed to delete time entry.' });
     return;
  }
};

// ------------------- START BREAK -------------------
export const startBreakController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await startBreak(id);
     res.status(200).json(updated);
      return;
  } catch (error: any) {
     res.status(400).json({ message: error.message || 'Failed to start break.' });
     return;
  }
};

// ------------------- END BREAK -------------------
export const endBreakController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await endBreak(id);
     res.status(200).json(updated);
      return;
  } catch (error: any) {
     res.status(400).json({ message: error.message || 'Failed to end break.' });
     return;
  }
};

// ------------------- MARK ABSENT -------------------
export const markAsAbsentController = async (req: Request, res: Response) => {
  try {
    const { employeeId, shiftId, reason } = req.body;
    const entry = await markAsAbsent(employeeId, shiftId, reason);
     res.status(201).json(entry);
      return;
  } catch (error: any) {
     res.status(400).json({ message: error.message || 'Failed to mark absent.' });
     return;
  }
};



// ------------------- FETCH ABSENCES -------------------
export const fetchAbsencesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const user = await User.findOne({ employee_id: employeeId }).select('_id');
    if (!user) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    const absences = await TimeEntry.find({
      employee: user._id,
      status: 'absent',
    })
      .select('reasonForAbsence createdAt')
      .lean();

    res.status(200).json(absences);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch absences.' });
  }
};

// ------------------- FETCH CURRENT STATUS -------------------
export const fetchCurrentStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const user = await User.findOne({ employee_id: employeeId }).select('_id');
    if (!user) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    // Grab the most recent time entry
    const timeEntry = await TimeEntry.findOne({ employee: user._id })
      .sort({ createdAt: -1 })
      .populate('shift', 'date startTime endTime')
      .lean();

    if (!timeEntry) {
      res.status(404).json({ message: 'No time entry found for this employee.' });
      return;
    }

    const currentStatus = {
      currentStatus: timeEntry.status,
      timeEntryId: timeEntry._id,
      clockIn: timeEntry.clockIn,
      clockOut: timeEntry.clockOut,
      shift: timeEntry.shift,
      activeBreak: timeEntry.breaks?.find((b) => !b.breakEnd) || null,
    };

    res.status(200).json(currentStatus);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch current status.' });
  }
};

