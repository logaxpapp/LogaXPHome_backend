import { Request, Response } from 'express';
import {
  getEmployeePayPeriodsByPayPeriod,
  getEmployeePayPeriodsByEmployee,
  getEmployeePayPeriodById,
  createEmployeePayPeriod,
  updateEmployeePayPeriod,
  deleteEmployeePayPeriod,
} from '../services/employeePayPeriodService';
import mongoose from 'mongoose';

// **Validation Middleware Example** for ObjectId
export const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// **Controller Methods**

// Get all pay periods for an employee
export const getEmployeePayPeriodsController = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    if (!isValidObjectId(employeeId)) {
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
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid EmployeePayPeriod ID.' });
      return;
    }

    const payPeriod = await getEmployeePayPeriodById(id);

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

    if (!isValidObjectId(payPeriodId)) {
      res.status(400).json({ message: 'Invalid payPeriod ID.' });
      return;
    }

    const employeePayPeriods = await getEmployeePayPeriodsByPayPeriod(payPeriodId);
    res.status(200).json(employeePayPeriods);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/// Create EmployeePayPeriod
export const createEmployeePayPeriodController = async (req: Request, res: Response) => {
  try {
    // Log the received request body
    console.log('Received Request Body:', req.body);

    const { payPeriodId, employeeId, ...rest } = req.body;

    // Validate required fields
    if (!payPeriodId || !employeeId) {
      console.log('Validation Error: Missing required fields');
      res.status(400).json({ message: 'payPeriodId and employeeId are required.' });
      return;
    }

    // Validate ObjectId
    if (!isValidObjectId(payPeriodId) || !isValidObjectId(employeeId)) {
      console.log('Validation Error: Invalid ObjectId');
      res.status(400).json({ message: 'Invalid payPeriodId or employeeId.' });
      return;
    }

    // Attempt to create the EmployeePayPeriod
    console.log('Attempting to create EmployeePayPeriod with:', { payPeriodId, employeeId, ...rest });
    const employeePayPeriod = await createEmployeePayPeriod(payPeriodId, employeeId, rest);

    // Log the created EmployeePayPeriod
    console.log('Created EmployeePayPeriod:', employeePayPeriod);

    res.status(201).json(employeePayPeriod);
  } catch (error: any) {
    // Log the error message
    console.error('Error in createEmployeePayPeriodController:', error.message);

    res.status(400).json({ message: error.message });
  }
};


// Update EmployeePayPeriod
export const updateEmployeePayPeriodController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!isValidObjectId(id)) {
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

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid EmployeePayPeriod ID.' });
      return;
    }

    await deleteEmployeePayPeriod(id);
    res.status(200).json({ message: 'EmployeePayPeriod deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
