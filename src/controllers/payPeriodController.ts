// src/controllers/payPeriodController.ts

import { Request, Response } from 'express';
import {
  createPayPeriod,
  closePayPeriod,
  processPayPeriod,
} from '../services/payPeriodService';
import PayPeriod from '../models/PayPeriod';
import EmployeePayPeriod from '../models/PayPeriodEmployee';
import mongoose from 'mongoose';

// Controller to create a new PayPeriod
export const createPayPeriodController = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const createdBy = req.user._id;

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'Start date and end date are required.' });
        return;
    }

    const payPeriod = await createPayPeriod(
      new Date(startDate),
      new Date(endDate),
      new mongoose.Types.ObjectId(createdBy)
    );

    res.status(201).json(payPeriod);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Controller to close a PayPeriod
export const closePayPeriodController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payPeriod = await closePayPeriod(id);

    res.status(200).json(payPeriod);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Controller to process a PayPeriod (calculate payroll)
export const processPayPeriodController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hourlyRate, overtimeRate } = req.body;

    if (!hourlyRate) {
      res.status(400).json({ message: 'Hourly rate is required.' });
      return;
    }

    // Process the pay period
    await processPayPeriod(id, Number(hourlyRate), overtimeRate ? Number(overtimeRate) : 1.5);

    res.status(200).json({ message: 'Pay period processed successfully.' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Controller to get all PayPeriods
export const getAllPayPeriodsController = async (req: Request, res: Response) => {
  try {
    const payPeriods = await PayPeriod.find()
      .populate('createdBy', 'name email')
      .populate('shifts');

    res.status(200).json(payPeriods);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to get a single PayPeriod by ID
export const getPayPeriodByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payPeriod = await PayPeriod.findById(id)
      .populate('createdBy', 'name email')
      .populate('shifts');

    if (!payPeriod) {
      res.status(404).json({ message: 'Pay period not found.' });
        return;
    }

    res.status(200).json(payPeriod);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to get a detailed summary for an employee in a specific PayPeriod
export const getEmployeePayPeriodSummaryController = async (req: Request, res: Response) => {
  try {
    const { id: payPeriodId, employeeId } = req.params;

    const summary = await EmployeePayPeriod.findOne({ payPeriod: payPeriodId, employee: employeeId })
      .populate('payPeriod', 'startDate endDate status')
      .lean();

    if (!summary) {
        res.status(404).json({ message: 'Summary not found.' });
        return;
    }

    res.status(200).json(summary);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
