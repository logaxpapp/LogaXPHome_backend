// src/services/payPeriodService.ts

import PayPeriod, { IPayPeriod, PayPeriodStatus } from '../models/PayPeriod';
import Shift from '../models/Shift';
import TimeEntry from '../models/TimeEntry';
import EmployeePayPeriod from '../models/PayPeriodEmployee';
import { IShiftUnpopulated } from '../types/shift';
import { IUser } from '../models/User';
import mongoose from 'mongoose';
import moment from 'moment';

// Interface for Payroll Calculation
export interface PayrollCalculation {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

// Function to create a new PayPeriod
export const createPayPeriod = async (
  startDate: Date,
  endDate: Date,
  createdBy: mongoose.Types.ObjectId
): Promise<IPayPeriod> => {
  // Validate dates
  if (startDate >= endDate) {
    throw new Error('Start date must be before end date.');
  }

  // Check for overlapping pay periods
  const overlapping = await PayPeriod.findOne({
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  });

  if (overlapping) {
    throw new Error('Pay period overlaps with an existing pay period.');
  }

  // Create PayPeriod
  const payPeriod = new PayPeriod({
    startDate,
    endDate,
    status: PayPeriodStatus.Open,
    createdBy,
  });

  await payPeriod.save();

  // Associate Shifts within the PayPeriod
  const shifts: IShiftUnpopulated[] = await Shift.find({
    date: { $gte: startDate, $lte: endDate },
    payPeriod: null, // Only assign shifts not yet assigned to a pay period
  }).exec() as IShiftUnpopulated[];

  const shiftIds: mongoose.Types.ObjectId[] = shifts.map(shift => shift._id);

  if (shiftIds.length > 0) {
    // Update shifts to reference the new pay period
    await Shift.updateMany(
      { _id: { $in: shiftIds } },
      { $set: { payPeriod: payPeriod._id } }
    );

    // Update payPeriod with associated shifts
    payPeriod.shifts = shiftIds;
    await payPeriod.save();
  }

  return payPeriod;
};

// Function to close a PayPeriod
export const closePayPeriod = async (payPeriodId: string): Promise<IPayPeriod> => {
  const payPeriod = await PayPeriod.findById(payPeriodId);

  if (!payPeriod) {
    throw new Error('Pay period not found.');
  }

  if (payPeriod.status !== PayPeriodStatus.Open) {
    throw new Error('Only open pay periods can be closed.');
  }

  payPeriod.status = PayPeriodStatus.Closed;
  await payPeriod.save();

  return payPeriod;
};

// Function to process (calculate payroll) a PayPeriod
export const processPayPeriod = async (
  payPeriodId: string,
  hourlyRate: number,
  overtimeRate: number = 1.5
): Promise<PayrollCalculation> => {
  const payPeriod = await PayPeriod.findById(payPeriodId).populate('shifts');

  if (!payPeriod) {
    throw new Error('Pay period not found.');
  }

  if (payPeriod.status !== PayPeriodStatus.Closed) {
    throw new Error('Only closed pay periods can be processed.');
  }

  const shifts: IShiftUnpopulated[] = payPeriod.shifts as IShiftUnpopulated[];

  let totalHours = 0;
  let overtimeHours = 0;

  shifts.forEach(shift => {
    const hoursWorked = calculateShiftHours(shift.startTime, shift.endTime);
    totalHours += hoursWorked;

    if (hoursWorked > 8) { // Assuming overtime after 8 hours per shift
      overtimeHours += hoursWorked - 8;
    }
  });

  const regularHours = totalHours - overtimeHours;
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;
  const totalPay = regularPay + overtimePay;

  // Update payPeriod status to Processed
  payPeriod.status = PayPeriodStatus.Processed;
  await payPeriod.save();

  return {
    totalHours,
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    totalPay,
  };
};

// Helper function to calculate hours worked in a shift
export const calculateShiftHours = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Difference in hours

  // Handle overnight shifts
  if (diff < 0) {
    diff += 24;
  }

  return diff > 0 ? diff : 0;
};

export const calculateDeductions = (grossPay: number, deductionsConfig: any): number => {
    const { taxRate, benefits, customDeductions } = deductionsConfig;
    const tax = grossPay * (taxRate || 0.2); // Default tax rate: 20%
    const benefitCost = benefits || 0; // Employee benefits
    const custom = customDeductions || 0; // Any custom deductions
    return tax + benefitCost + custom;
  };
  

  export const calculateEmployeePayPeriod = async (payPeriodId: string) => {
    const payPeriod = await PayPeriod.findById(payPeriodId).populate('shifts');
    if (!payPeriod) throw new Error('PayPeriod not found.');
  
    const employees: Record<string, any> = {};
  
    for (const shift of payPeriod.shifts) {
      const timeEntries = await TimeEntry.find({ shift: shift._id });
  
      timeEntries.forEach((entry) => {
        // Use ISO string to safely use as object keys
        const weekStart = moment(entry.clockIn).startOf('isoWeek').toISOString();
        const weekKey = `${entry.employee}-${weekStart}`;
  
        // Initialize employee data for this week
        if (!employees[weekKey]) {
          employees[weekKey] = {
            totalHours: 0,
            regularHours: 0,
            overtimeHours: 0,
            weeklyTotals: {}, // Track weekly hours
          };
        }
  
        const workedHours = entry.hoursWorked || 0;
        employees[weekKey].totalHours += workedHours;
  
        // Group by week and calculate weekly caps
        if (!employees[weekKey].weeklyTotals[weekStart]) {
          employees[weekKey].weeklyTotals[weekStart] = 0;
        }
        employees[weekKey].weeklyTotals[weekStart] += workedHours;
  
        // Weekly cap logic
        const weeklyHours = employees[weekKey].weeklyTotals[weekStart];
        const regularHoursThisWeek = Math.min(weeklyHours, 40);
        const overtimeHoursThisWeek = Math.max(0, weeklyHours - 40);
  
        employees[weekKey].regularHours = regularHoursThisWeek;
        employees[weekKey].overtimeHours += overtimeHoursThisWeek;
      });
    }
  
    // Store data in EmployeePayPeriod
    for (const [weekKey, data] of Object.entries(employees)) {
      const [employeeId] = weekKey.split('-');
      const totalPay = data.regularHours * 20 + data.overtimeHours * 30; // Example rates
  
      await EmployeePayPeriod.create({
        payPeriod: payPeriod._id,
        employee: employeeId,
        totalHours: data.totalHours,
        regularHours: data.regularHours,
        overtimeHours: data.overtimeHours,
        totalPay,
        regularPay: data.regularHours * 20,
        overtimePay: data.overtimeHours * 30,
      });
    }
  };
  
  export const calculateHours = (workedHours: number) => {
    const regularHours = Math.min(workedHours, 40);
    const overtimeHours = Math.max(0, workedHours - 40);
    return { regularHours, overtimeHours };
  };

  
  export const calculatePayroll = (
    regularHours: number,
    overtimeHours: number,
    hourlyRate: number,
    overtimeRate: number
  ) => {
    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * overtimeRate;
    const totalPay = regularPay + overtimePay;
    return { regularPay, overtimePay, totalPay };
  };
  