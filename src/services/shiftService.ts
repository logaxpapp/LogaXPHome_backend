// src/services/shiftService.ts

import ShiftType, { IShiftType, ShiftTypeName } from '../models/ShiftType';
import Shift, { IShift, ShiftStatus } from '../models/Shift';
import User, { IUser } from '../models/User'; // Assume User model exists
import { UserStatus } from '../types/enums';
import { sendShiftAssignmentNotification } from '../utils/email';
import { IShiftPopulated } from '../types/shift'; 
import mongoose, { FilterQuery, HydratedDocument } from 'mongoose';

// Pagination Interface
export interface PaginationOptions {
  page: number;
  limit: number;
}

interface CreateMultipleShiftsOptions {
  repeatDaily?: boolean; // True if we want the shift to repeat daily
  endDate?: Date;        // End date for daily repetition
  count?: number;        // Number of shifts to create on the same day
}

// Create a new Shift Type
export const createShiftType = async (name: ShiftTypeName, description?: string): Promise<IShiftType> => {
  const existingShiftType = await ShiftType.findOne({ name });
  if (existingShiftType) {
    throw { status: 400, message: 'Shift type already exists' };
  }

  const shiftType = new ShiftType({ name, description });
  await shiftType.save();
  return shiftType;
};

// Get all Shift Types
export const getAllShiftTypes = async (): Promise<IShiftType[]> => {
  return ShiftType.find()
    .sort({ name: 1 })
    .lean<IShiftType[]>(); // Changed to IShiftType[]
};

// Update a Shift Type
export const updateShiftType = async (id: string, updates: Partial<IShiftType>): Promise<IShiftType> => {
  const shiftType = await ShiftType.findById(id);
  if (!shiftType) {
    throw { status: 404, message: 'Shift type not found' };
  }

  if (updates.name && updates.name !== shiftType.name) {
    const existingShiftType = await ShiftType.findOne({ name: updates.name });
    if (existingShiftType) {
      throw { status: 400, message: 'Another shift type with this name already exists' };
    }
    shiftType.name = updates.name as ShiftTypeName;
  }

  if (updates.description !== undefined) {
    shiftType.description = updates.description;
  }

  await shiftType.save();
  return shiftType;
};

// Delete a Shift Type
export const deleteShiftType = async (id: string): Promise<void> => {
  const shiftType = await ShiftType.findById(id);
  if (!shiftType) {
    throw { status: 404, message: 'Shift type not found' };
  }

  // Check if any shifts are associated with this shift type
  const associatedShifts = await Shift.findOne({ shiftType: id });
  if (associatedShifts) {
    throw { status: 400, message: 'Cannot delete shift type with associated shifts' };
  }

  await ShiftType.findByIdAndDelete(id);
};

// Create a new Shift
export const createShift = async (
  shiftTypeId: string,
  date: Date,
  startTime: string,
  endTime: string,
  createdBy: mongoose.Types.ObjectId,
  applicationManaged: string[],
  isExcess: boolean = false,
  payPeriod?: mongoose.Types.ObjectId // New parameter
): Promise<IShift> => {
  // Validate ShiftType
  const shiftType = await ShiftType.findById(shiftTypeId);
  if (!shiftType) {
    throw { status: 400, message: 'Invalid shift type' };
  }

  // Create the Shift
  const shift = new Shift({
    shiftType: shiftType._id,
    date,
    startTime,
    endTime,
    status: ShiftStatus.Open,
    isExcess,
    createdBy,
    applicationManaged,
    payPeriod, // Associate with payPeriod if provided
  });

  await shift.save();
  return shift;
};

// Get all Shifts with optional filters
export const getAllShifts = async (filters: FilterQuery<IShift>): Promise<IShiftPopulated[]> => {
  return Shift.find(filters)
    .populate('shiftType')
    .populate('assignedTo', '-password_hash')
    .sort({ date: 1, startTime: 1 })
    .lean<IShiftPopulated[]>(); // Changed to IShiftPopulated[]
};

// Pagination and Filtering
export const getAllShiftsPaginated = async (
  filters: FilterQuery<IShift>,
  pagination: PaginationOptions
): Promise<{ shifts: IShiftPopulated[]; total: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [shifts, total] = await Promise.all([
    Shift.find(filters)
      .populate('shiftType')
      .populate('assignedTo', '-password_hash')
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean<IShiftPopulated[]>(), // Changed to IShiftPopulated[]
    Shift.countDocuments(filters),
  ]);

  return { shifts, total };
};

// Update a Shift
export const updateShift = async (
  shiftId: string,
  updates: Partial<IShift>
): Promise<IShift> => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw { status: 404, message: 'Shift not found' };
  }

  if (updates.shiftType) {
    const shiftType = await ShiftType.findById(updates.shiftType);
    if (!shiftType) {
      throw { status: 400, message: 'Invalid shift type' };
    }
    shift.shiftType = updates.shiftType;
  }

  if (updates.date) shift.date = updates.date;
  if (updates.startTime) shift.startTime = updates.startTime;
  if (updates.endTime) shift.endTime = updates.endTime;
  if (updates.assignedTo) shift.assignedTo = updates.assignedTo;
  if (updates.status) shift.status = updates.status as ShiftStatus;
  if (updates.isExcess !== undefined) shift.isExcess = updates.isExcess;
  if (updates.applicationManaged) shift.applicationManaged = updates.applicationManaged;
  if (updates.payPeriod) shift.payPeriod = updates.payPeriod; // Update payPeriod reference

  await shift.save();
  return shift;
};


// Delete a Shift
export const deleteShift = async (shiftId: string): Promise<void> => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw { status: 404, message: 'Shift not found' };
  }

  await Shift.findByIdAndDelete(shiftId);
};

// Assign Shift to Employee
export const assignShift = async (shiftId: string, userId: string): Promise<IShift> => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw { status: 404, message: 'Shift not found' };
  }

  if (shift.status !== ShiftStatus.Open) {
    throw { status: 400, message: 'Shift is not open for assignment' };
  }

  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  // Ensure applications_managed is defined
  if (!user.applications_managed || user.applications_managed.length === 0) {
    throw { status: 403, message: 'User does not have any applications to manage shifts' };
  }

  // Check if the shift's applicationManaged includes any of the user's applications_managed
  const hasAccess = user.applications_managed.some(app => shift.applicationManaged.includes(app));
  if (!hasAccess) {
    throw { status: 403, message: 'User does not have access to manage this shift' };
  }

  // Assign shift
  shift.assignedTo = user._id;
  shift.status = ShiftStatus.Assigned;
  await shift.save();

  // Notify the user about the assignment
  await sendShiftAssignmentNotification(user as IUser, shift, 'Assigned');

  return shift;
};

// Assign Shift to All Employees
export const assignShiftToAll = async (
  shiftTypeId: string,
  date: Date,
  startTime: string,
  endTime: string,
  createdBy: mongoose.Types.ObjectId,
  applicationManaged: string[],
  isExcess: boolean = false
): Promise<IShift[]> => {
  // Create the shift
  const shift = await createShift(shiftTypeId, date, startTime, endTime, createdBy, applicationManaged, isExcess);

  // Assign to all users who have matching applications_managed
  const users = await User.find({ applications_managed: { $in: applicationManaged }, status: UserStatus.Active });

  const assignments: IShift[] = [];

  for (const user of users) {
    // Assign shift to each user
    const newShift = new Shift({
      shiftType: shift.shiftType,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: ShiftStatus.Assigned,
      assignedTo: user._id,
      createdBy: createdBy,
      applicationManaged: shift.applicationManaged,
    });
    await newShift.save();
    assignments.push(newShift);

    // Notify each user about the assignment
    await sendShiftAssignmentNotification(user, newShift, 'Assigned');
  }

  return assignments;
};

// Employee requests to pick an open shift
export const requestShiftAssignment = async (
  shiftId: string,
  userId: string
): Promise<IShift> => {
  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw { status: 404, message: 'Shift not found' };
  }

  if (shift.status !== ShiftStatus.Open) {
    throw { status: 400, message: 'Shift is not open for assignment' };
  }

  // Check if user already has a shift at this time
  const overlappingShift = await Shift.findOne({
    assignedTo: userId,
    date: shift.date,
    $or: [
      {
        startTime: { $lte: shift.startTime },
        endTime: { $gt: shift.startTime },
      },
      {
        startTime: { $lt: shift.endTime },
        endTime: { $gte: shift.endTime },
      },
      {
        startTime: { $gte: shift.startTime },
        endTime: { $lte: shift.endTime },
      },
    ],
  });

  if (overlappingShift) {
    throw { status: 400, message: 'You have an overlapping shift during this time' };
  }

  // Assign shift as PendingApproval
  shift.assignedTo = new mongoose.Types.ObjectId(userId);
  shift.status = ShiftStatus.PendingApproval;
  await shift.save();

  // Notify admin about the shift request (optional)
  // Implement notification logic here if needed

  return shift;
};

// Admin approves shift assignment
export const approveShiftAssignment = async (shiftId: string): Promise<HydratedDocument<IShiftPopulated>> => {
    const shift = await Shift.findById(shiftId)
      .populate('assignedTo')
      .populate('shiftType')
      .populate('createdBy') as HydratedDocument<IShiftPopulated>;
  
    if (!shift) {
      throw { status: 404, message: 'Shift not found' };
    }
  
    if (shift.status !== ShiftStatus.PendingApproval) {
      throw { status: 400, message: 'Shift is not pending approval' };
    }
  
    shift.status = ShiftStatus.Assigned;
    await shift.save();
  
    // Notify the user about the approval
    if (shift.assignedTo) {
      await sendShiftAssignmentNotification(shift.assignedTo as IUser, shift, 'Approved');
    }
  
    return shift;
  };


// Admin rejects shift assignment
export const rejectShiftAssignment = async (shiftId: string): Promise<HydratedDocument<IShiftPopulated>> => {
    const shift = await Shift.findById(shiftId)
      .populate('assignedTo')
      .populate('shiftType')
      .populate('createdBy') as HydratedDocument<IShiftPopulated>;
  
    if (!shift) {
      throw { status: 404, message: 'Shift not found' };
    }
  
    if (shift.status !== ShiftStatus.PendingApproval) {
      throw { status: 400, message: 'Shift is not pending approval' };
    }
  
    // Remove assignment
    const assignedUserId = shift.assignedTo?._id;
    shift.assignedTo = undefined;
    shift.status = ShiftStatus.Open;
    await shift.save();
  
    // Notify the user about the rejection
    if (assignedUserId) {
      const user = await User.findById(assignedUserId);
      if (user) {
        await sendShiftAssignmentNotification(user, shift, 'Rejected');
      }
    }
  
    return shift;
  };

  export const createMultipleShifts = async (
    shiftTypeId: string,
    startDate: Date, // Updated parameter
    startTime: string,
    endTime: string,
    createdBy: mongoose.Types.ObjectId,
    applicationManaged: string[],
    isExcess: boolean = false,
    options?: CreateMultipleShiftsOptions
  ): Promise<IShift[]> => {
    const shifts: IShift[] = [];
  
    if (options?.repeatDaily && options.endDate) {
      // Create shifts daily from 'startDate' to 'endDate'
      let currentDate = new Date(startDate); // Starting point
      while (currentDate <= options.endDate) {
        const shift = new Shift({
          shiftType: shiftTypeId,
          date: new Date(currentDate),
          startTime,
          endTime,
          status: ShiftStatus.Open,
          isExcess,
          createdBy,
          applicationManaged,
        });
        await shift.save();
        shifts.push(shift);
  
        // Increment date by one day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (options?.count && options.count > 1) {
      // Create 'count' number of shifts on the same date
      for (let i = 0; i < options.count; i++) {
        const shift = new Shift({
          shiftType: shiftTypeId,
          date: startDate,
          startTime,
          endTime,
          status: ShiftStatus.Open,
          isExcess,
          createdBy,
          applicationManaged,
        });
        await shift.save();
        shifts.push(shift);
      }
    } else {
      // Create a single shift as a fallback
      const shift = new Shift({
        shiftType: shiftTypeId,
        date: startDate,
        startTime,
        endTime,
        status: ShiftStatus.Open,
        isExcess,
        createdBy,
        applicationManaged,
      });
      await shift.save();
      shifts.push(shift);
    }
  
    return shifts;
  };
  

// Employee assigns themselves to an open shift (requires admin approval)
export const pickOpenShift = async (shiftId: string, userId: string): Promise<IShift> => {
  return requestShiftAssignment(shiftId, userId);
};

// Fetch shifts assigned to an employee
export const getShiftsByEmployee = async (employeeId: string): Promise<IShift[]> => {
  const employee = await User.findOne({ employee_id: employeeId });
  if (!employee) {
    throw { status: 404, message: 'Employee not found' };
  }

  return Shift.find({ assignedTo: employee._id })
    .populate('shiftType', 'name description')
    .lean<IShift[]>(); // Populate shiftType for details and return lean objects
};

export const checkActiveShift = async (employeeId: string): Promise<IShift | null> => {
  const now = new Date();

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new Error('Invalid employee ID format.');
  }

  const shift = await Shift.findOne({
    assignedTo: new mongoose.Types.ObjectId(employeeId),
    date: { $lte: now },
    startTime: { $lte: now.toTimeString().substring(0, 5) },
    endTime: { $gt: now.toTimeString().substring(0, 5) },
    status: { $in: [ShiftStatus.Open, ShiftStatus.Assigned] },
  }).lean<IShift>();

  return shift || null;
};

export const createTemporaryShift = async (employeeId: string, clockInTime: Date): Promise<IShift> => {
  console.log('Creating temporary shift for employee:', employeeId);

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    console.error('Invalid employee ID format:', employeeId);
    throw new Error('Invalid employee ID format.');
  }

  const tempShiftType = await ShiftType.findOne({ name: ShiftTypeName.TEMPSHIFT });
  if (!tempShiftType) {
    console.error('TEMPSHIFT type not found. Please ensure it exists.');
    throw new Error('TEMPSHIFT type not found. Please ensure it exists.');
  }

  console.log('Found TEMPSHIFT type:', tempShiftType);

  const defaultEndTime = new Date(clockInTime);
  defaultEndTime.setHours(clockInTime.getHours() + 8); // Default 8-hour shift duration

  const tempShift = new Shift({
    shiftType: tempShiftType._id,
    date: clockInTime,
    startTime: clockInTime.toTimeString().substring(0, 5),
    endTime: defaultEndTime.toTimeString().substring(0, 5),
    assignedTo: new mongoose.Types.ObjectId(employeeId),
    status: ShiftStatus.PendingApproval,
    isTemporary: true,
    createdBy: new mongoose.Types.ObjectId(employeeId),
  });

  await tempShift.save();
  console.log('Temporary shift created:', tempShift);

  return tempShift;
};
