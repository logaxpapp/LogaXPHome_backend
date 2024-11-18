import EmployeePayPeriod from '../models/PayPeriodEmployee';
import PayPeriod from '../models/PayPeriod';
import { IPayPeriodEmployee } from '../models/PayPeriodEmployee';
import { IUser } from '../models/User';
import mongoose from 'mongoose';

// Fetch all EmployeePayPeriods for a given PayPeriod
export const getEmployeePayPeriodsByPayPeriod = async (
  payPeriodId: string
): Promise<IPayPeriodEmployee[]> => {
  const payPeriodExists = await PayPeriod.exists({ _id: payPeriodId });
  if (!payPeriodExists) {
    throw new Error('PayPeriod not found.');
  }

  return EmployeePayPeriod.find({ payPeriod: payPeriodId })
    .populate('employee', 'name email') // Populate employee details
    .populate('payPeriod', 'startDate endDate status'); // Populate payPeriod details
};

// Fetch EmployeePayPeriods for a specific employee
export const getEmployeePayPeriodsByEmployee = async (
  employeeId: string
): Promise<IPayPeriodEmployee[]> => {
  return EmployeePayPeriod.find({ employee: employeeId })
    .populate('payPeriod', 'startDate endDate status') // Populate payPeriod details
    .populate('employee', 'name email'); // Populate employee details
};

// Get a specific EmployeePayPeriod by ID
export const getEmployeePayPeriodById = async (
  id: string
): Promise<IPayPeriodEmployee | null> => {
  return EmployeePayPeriod.findById(id)
    .populate('payPeriod', 'startDate endDate status')
    .populate('employee', 'name email');
};

// Create EmployeePayPeriod manually (if needed)
export const createEmployeePayPeriod = async (
  payPeriodId: string,
  employeeId: string,
  totalHours: number,
  regularHours: number,
  overtimeHours: number,
  hourlyRate: number,
  overtimeRate: number
): Promise<IPayPeriodEmployee> => {
  const totalPay = regularHours * hourlyRate + overtimeHours * hourlyRate * overtimeRate;
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;

  return EmployeePayPeriod.create({
    payPeriod: new mongoose.Types.ObjectId(payPeriodId),
    employee: new mongoose.Types.ObjectId(employeeId),
    totalHours,
    regularHours,
    overtimeHours,
    totalPay,
    regularPay,
    overtimePay,
  });
};

// Update EmployeePayPeriod
export const updateEmployeePayPeriod = async (
  id: string,
  updates: Partial<IPayPeriodEmployee>
): Promise<IPayPeriodEmployee | null> => {
  return EmployeePayPeriod.findByIdAndUpdate(id, updates, { new: true })
    .populate('payPeriod', 'startDate endDate status')
    .populate('employee', 'name email');
};

// Delete EmployeePayPeriod
export const deleteEmployeePayPeriod = async (id: string): Promise<void> => {
  await EmployeePayPeriod.findByIdAndDelete(id);
};
