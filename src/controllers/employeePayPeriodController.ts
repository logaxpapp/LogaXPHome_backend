import { Request, Response } from 'express';
import {
  getEmployeePayPeriodsByPayPeriod,
  getEmployeePayPeriodsByEmployee,
  getEmployeePayPeriodById,
  createEmployeePayPeriod,
  updateEmployeePayPeriod,
  deleteEmployeePayPeriod,
} from '../services/employeePayPeriodService';
import { validateTimeEntriesForShifts } from '../middlewares/payPeriodValidation';
import EmployeePayPeriod from '../models/PayPeriodEmployee';

// Middleware integration and additional validations
import mongoose from 'mongoose';

// **Validation Middleware Example** for ObjectId
const validateObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// **TimeEntry Conflict Prevention**
const preventTimeEntryConflict = async (
  employeeId: string,
  shiftId: string,
  clockIn: Date,
  clockOut: Date | null
): Promise<void> => {
  const conflictingEntries = await EmployeePayPeriod.find({
    employee: employeeId,
    shift: shiftId,
    $or: [
      { clockIn: { $gte: clockIn, $lt: clockOut } },
      { clockOut: { $gte: clockIn, $lt: clockOut } },
    ],
  });

  if (conflictingEntries.length > 0) {
    throw new Error('Conflicting time entries found for this employee and shift.');
  }
};

// **Controller Methods**
// Get all pay periods for an employee
export const getEmployeePayPeriodsController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    if (!validateObjectId(employeeId)) {
      res.status(400).json({ message: 'Invalid employee ID.' });
      return;
    }

    const payPeriods = await getEmployeePayPeriodsByEmployee(employeeId);
    res.status(200).json(payPeriods);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get detailed summary of a specific pay period
export const getEmployeePayPeriodByIdController = async (req: Request, res: Response) => {
  try {
    const { employeeId, payPeriodId } = req.params;

    if (!validateObjectId(employeeId) || !validateObjectId(payPeriodId)) {
      res.status(400).json({ message: 'Invalid employee ID or payPeriod ID.' });
      return;
    }

    const payPeriod = await getEmployeePayPeriodById(payPeriodId);

    if (!payPeriod) {
      res.status(404).json({ message: 'Pay period not found.' });
      return;
    }

    res.status(200).json(payPeriod);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get all EmployeePayPeriods for a specific PayPeriod
export const getEmployeePayPeriodsForPayPeriodController = async (req: Request, res: Response) => {
  try {
    const { payPeriodId } = req.params;

    if (!validateObjectId(payPeriodId)) {
      res.status(400).json({ message: 'Invalid payPeriod ID.' });
      return;
    }

    const employeePayPeriods = await getEmployeePayPeriodsByPayPeriod(payPeriodId);
    res.status(200).json(employeePayPeriods);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Create EmployeePayPeriod (optional route for manual creation)
export const createEmployeePayPeriodController = async (req: Request, res: Response) => {
  try {
    const { payPeriodId, employeeId, totalHours, regularHours, overtimeHours, hourlyRate, overtimeRate } = req.body;

    if (!validateObjectId(payPeriodId) || !validateObjectId(employeeId)) {
      res.status(400).json({ message: 'Invalid payPeriod ID or employee ID.' });
      return;
    }

    // Prevent time entry conflicts
    await preventTimeEntryConflict(employeeId, payPeriodId, new Date(totalHours), null);

    const employeePayPeriod = await createEmployeePayPeriod(
      payPeriodId,
      employeeId,
      totalHours,
      regularHours,
      overtimeHours,
      hourlyRate,
      overtimeRate
    );

    res.status(201).json(employeePayPeriod);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Update EmployeePayPeriod
export const updateEmployeePayPeriodController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!validateObjectId(id)) {
      res.status(400).json({ message: 'Invalid EmployeePayPeriod ID.' });
      return;
    }

    const updatedPayPeriod = await updateEmployeePayPeriod(id, updates);

    if (!updatedPayPeriod) {
      res.status(404).json({ message: 'EmployeePayPeriod not found.' });
      return;
    }

    res.status(200).json(updatedPayPeriod);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete EmployeePayPeriod
export const deleteEmployeePayPeriodController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      res.status(400).json({ message: 'Invalid EmployeePayPeriod ID.' });
      return;
    }

    await deleteEmployeePayPeriod(id);
    res.status(200).json({ message: 'EmployeePayPeriod deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
