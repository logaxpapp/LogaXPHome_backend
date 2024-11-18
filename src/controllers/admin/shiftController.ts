// src/controllers/admin/shiftController.ts

import { Request, Response } from 'express';
import {
  createShift,
  getAllShiftsPaginated,
  updateShift,
  deleteShift,
  assignShift,
  assignShiftToAll,
  approveShiftAssignment,
  rejectShiftAssignment,
  createMultipleShifts,
} from '../../services/shiftService';
import { ShiftStatus } from '../../models/Shift';
import mongoose from 'mongoose';


export const createShiftHandler = async (req: Request, res: Response) => {
  try {
    // Log the incoming data from the request body
    console.log('Received request body:', req.body);

    const { shiftType, date, startTime, endTime, applicationManaged, isExcess, payPeriod } = req.body;

    if (!shiftType || !date || !startTime || !endTime || !applicationManaged) {
      res.status(400).json({ message: 'Missing required fields' });
      console.log('Missing required fields:', req.body);
      return;
    }

    const createdBy = req.user?._id;
    if (!createdBy) {
      res.status(401).json({ message: 'Unauthorized' });
      console.log('Unauthorized request:', req.user);
      return;
    }

    // Validate payPeriod (optional)
    if (payPeriod) {
      const isValidPayPeriod = await mongoose.models.PayPeriod.exists({ _id: payPeriod });
      if (!isValidPayPeriod) {
        res.status(400).json({ message: 'Invalid payPeriod ID' });
        console.log('Invalid payPeriod ID:', payPeriod);
        return;
      }
    }

    const shift = await createShift(
      shiftType,
      new Date(date),
      startTime,
      endTime,
      createdBy,
      applicationManaged,
      isExcess,
      payPeriod
    );

    // Log the data sent in the response
    console.log('Created shift data:', shift);

    res.status(201).json({ shift });
  } catch (error: any) {
    console.error('Error creating shift:', error);
    res.status(error.status || 500).json({ message: error.message || 'Failed to create shift' });
  }
};



// Get all Shifts with optional filters and pagination
export const getShiftsHandler = async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    // Example: Filter by status, shiftType, date range, etc.
    const { status, shiftTypeId, startDate, endDate, page = '1', limit = '10' } = req.query;

    if (status && typeof status === 'string') {
      if (!Object.values(ShiftStatus).includes(status as ShiftStatus)) {
        res.status(400).json({ message: 'Invalid shift status' });
        return;
      }
      filters.status = status as ShiftStatus;
    }

    if (shiftTypeId && typeof shiftTypeId === 'string') {
      filters.shiftType = shiftTypeId;
    }

    if (startDate || endDate) {
      filters.date = {};
      if (startDate && typeof startDate === 'string') {
        filters.date.$gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        filters.date.$lte = new Date(endDate);
      }
    }

    const pagination = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const { shifts, total } = await getAllShiftsPaginated(filters, pagination);

    res.status(200).json({ shifts, total });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to get shifts' });
  }
};

// Update a Shift
export const updateShiftHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate payPeriod if provided
    if (updates.payPeriod) {
      const isValidPayPeriod = await mongoose.models.PayPeriod.exists({ _id: updates.payPeriod });
      if (!isValidPayPeriod) {
        res.status(400).json({ message: 'Invalid payPeriod ID' });
        return;
      }
    }

    const updatedShift = await updateShift(id, updates);
    res.status(200).json({ shift: updatedShift });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to update shift' });
  }
};


// Delete a Shift
export const deleteShiftHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteShift(id);
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to delete shift' });
  }
};

// Assign Shift to Employee
export const assignShiftHandler = async (req: Request, res: Response) => {
  try {
    const { shiftId, userId } = req.body;

    if (!shiftId || !userId) {
      res.status(400).json({ message: 'shiftId and userId are required' });
      return;
    }

    const shift = await assignShift(shiftId, userId);
    res.status(200).json({ shift });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to assign shift' });
  }
};

// Assign Shift to All Employees
export const assignShiftToAllHandler = async (req: Request, res: Response) => {
  try {
    const { shiftTypeId, date, startTime, endTime, applicationManaged, isExcess } = req.body;

    if (!shiftTypeId || !date || !startTime || !endTime || !applicationManaged) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const createdBy = req.user?._id;
    if (!createdBy) {
      res.status(401).json({ message: 'Unauthorized' });
        return
    }

    const assignments = await assignShiftToAll(
      shiftTypeId,
      new Date(date),
      startTime,
      endTime,
      createdBy,
      applicationManaged,
      isExcess
    );

    res.status(201).json({ assignments });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to assign shifts to all employees' });
  }
};

// Approve Shift Assignment (Admin)
export const approveShiftAssignmentHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // shift ID

    const shift = await approveShiftAssignment(id);
    res.status(200).json({ shift });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to approve shift assignment' });
  }
};

// Reject Shift Assignment (Admin)
export const rejectShiftAssignmentHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // shift ID

    const shift = await rejectShiftAssignment(id);
    res.status(200).json({ shift });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to reject shift assignment' });
  }
};

export const createMultipleShiftsHandler = async (req: Request, res: Response) => {
  try {
    const {
      shiftTypeId,
      startDate, // Use startDate instead of date
      startTime,
      endTime,
      applicationManaged,
      isExcess,
      repeatDaily,
      endDate, // Use endDate for the end of the range
      count,
    } = req.body;

    // Check for missing required fields
    if (!shiftTypeId || !startDate || !startTime || !endTime || !applicationManaged) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const createdBy = req.user?._id;
    if (!createdBy) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const options = {
      repeatDaily: Boolean(repeatDaily),
      endDate: endDate ? new Date(endDate) : undefined,
      count: count ? parseInt(count, 10) : undefined,
    };

    const shifts = await createMultipleShifts(
      shiftTypeId,
      new Date(startDate), // Pass startDate to the function
      startTime,
      endTime,
      createdBy,
      applicationManaged,
      isExcess,
      options
    );

    res.status(201).json({ shifts });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to create shifts' });
  }
};
