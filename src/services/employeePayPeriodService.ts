import EmployeePayPeriod from '../models/PayPeriodEmployee';
import PayPeriod from '../models/PayPeriod';
import Shift from '../models/Shift';
import User, { IUser } from '../models/User';
import TimeEntry from '../models/TimeEntry';
import { IPayPeriodEmployee } from '../models/PayPeriodEmployee';
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
    .populate('employee', 'name email hourlyRate overtimeRate') // Populate employee details
    .populate('payPeriod', 'startDate endDate status'); // Populate payPeriod details
};

// Fetch EmployeePayPeriods for a specific employee
export const getEmployeePayPeriodsByEmployee = async (
  employeeId: string
): Promise<IPayPeriodEmployee[]> => {
  return EmployeePayPeriod.find({ employee: employeeId })
    .populate('payPeriod', 'startDate endDate status') // Populate payPeriod details
    .populate('employee', 'name email hourlyRate overtimeRate'); // Populate employee details
};

// Get a specific EmployeePayPeriod by ID
export const getEmployeePayPeriodById = async (
  id: string
): Promise<IPayPeriodEmployee | null> => {
  return EmployeePayPeriod.findById(id)
    .populate('payPeriod', 'startDate endDate status')
    .populate('employee', 'name email hourlyRate overtimeRate');
};

export const createEmployeePayPeriod = async (
  payPeriodId: string,
  employeeId: string,
  data: Partial<IPayPeriodEmployee> 
): Promise<IPayPeriodEmployee> => {
  // Validate Object IDs
  if (!mongoose.Types.ObjectId.isValid(payPeriodId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error('Invalid payPeriod ID or employee ID.');
  }

  // Fetch PayPeriod
  const payPeriod = await PayPeriod.findById(payPeriodId).populate('shifts');
  if (!payPeriod) throw new Error('PayPeriod not found.');

  // Fetch Employee
  const employee = await User.findById(employeeId);
  if (!employee) throw new Error('Employee not found.');

  // Fetch Employee's Shifts within the PayPeriod
  const shifts = await Shift.find({
    _id: { $in: payPeriod.shifts },
    assignedTo: employeeId,
  });

  if (shifts.length === 0) {
    throw new Error('No shifts found for the employee in the selected pay period.');
  }

  // Fetch Time Entries for the Shifts
  const timeEntries = await TimeEntry.find({
    shift: { $in: shifts.map((shift) => shift._id) },
    employee: employeeId,
  });

  // Calculate hours and pay
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;

  // Use values from data or fallback to defaults
  const hourlyRate = data.hourlyRate || employee.hourlyRate || 20; // Fetch from data, User, or default
  const overtimeRate = data.overtimeRate || employee.overtimeRate || 1.5; // Fetch from data, User, or default

  timeEntries.forEach((entry) => {
    totalHours += entry.hoursWorked;

    if (entry.hoursWorked > 8) {
      regularHours += 8;
      overtimeHours += entry.hoursWorked - 8;
    } else {
      regularHours += entry.hoursWorked;
    }
  });

  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;
  const totalPay = regularPay + overtimePay;

  // Deduction Logic
  const deductions = data.deductions || 0; // Use from data or default
  const netPay = totalPay - deductions;

  // Create Employee Pay Period
  const employeePayPeriod = await EmployeePayPeriod.create({
    payPeriod: new mongoose.Types.ObjectId(payPeriodId),
    employee: new mongoose.Types.ObjectId(employeeId),
    totalHours,
    regularHours,
    overtimeHours,
    totalPay,
    regularPay,
    overtimePay,
    hourlyRate,
    overtimeRate,
    deductions,
    netPay,
    ...data, // Spread any additional fields provided in data
  });

  return employeePayPeriod;
};


// Update EmployeePayPeriod
export const updateEmployeePayPeriod = async (
  id: string,
  updates: Partial<IPayPeriodEmployee>
): Promise<IPayPeriodEmployee | null> => {
  return EmployeePayPeriod.findByIdAndUpdate(id, updates, { new: true })
    .populate('payPeriod', 'startDate endDate status')
    .populate('employee', 'name email hourlyRate overtimeRate');
};

// Delete EmployeePayPeriod
export const deleteEmployeePayPeriod = async (id: string): Promise<void> => {
  await EmployeePayPeriod.findByIdAndDelete(id);
};
