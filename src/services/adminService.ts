// src/services/adminService.ts

import User, { IUser, UserStatus, UserRole } from '../models/User';
import jwt from 'jsonwebtoken';
import {
  sendAccountDeletionNotification,
  sendInvitationEmail,
  sendPasswordResetEmail,
} from '../utils/email';
import csv from 'csv-parser';
import fs from 'fs';
import { Parser } from 'json2csv';

// Generate a unique Employee ID
const generateEmployeeId = async (): Promise<string> => {
  let employeeId: string;
  let exists: boolean;

  do {
    employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const user = await User.findOne({ employee_id: employeeId });
    exists = !!user;
  } while (exists);

  return employeeId;
};

// Get all users with status 'PendingDeletion'
export const getAllDeletionRequests = async (): Promise<IUser[]> => {
  return await User.find({ status: UserStatus.PendingDeletion });
};

// Approve deletion: remove user and notify
export const approveDeletionRequest = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  await User.findByIdAndDelete(userId);
  await sendAccountDeletionNotification(user.email, 'approved');
};

// Reject deletion: set status back to 'Active' and notify
export const rejectDeletionRequest = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  user.status = UserStatus.Active;
  await user.save();
  await sendAccountDeletionNotification(user.email, 'rejected');
};

// Admin: Create user and send invite
export const createUserAndSendInvite = async (
  input: { name: string; email: string; role?: UserRole },
  createdBy: IUser
): Promise<IUser> => {
  // Validate role
  const userRole: UserRole = input.role || UserRole.User;
  if (!Object.values(UserRole).includes(userRole)) {
    throw { status: 400, message: 'Invalid user role' };
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw { status: 400, message: 'User with this email already exists' };
  }

  const employeeId = await generateEmployeeId();

  const user = new User({
    name: input.name,
    email: input.email,
    role: userRole,
    status: UserStatus.Pending,
    createdBy: createdBy._id,
    employee_id: employeeId,
  });

  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
  await sendInvitationEmail(user.email, token);

  return user;
};

// Admin: Bulk create users from CSV
export const bulkCreateUsersFromCSV = async (filePath: string, createdBy: IUser): Promise<void> => {
  const errors: string[] = [];

  return new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on('data', async function (row) {
      // Pause the stream to handle async operations sequentially
      stream.pause();

      try {
        const { name, email, role } = row;

        // Validate required fields
        if (!name || !email) {
          throw new Error('Name and email are required');
        }

        // Validate role
        const userRole: UserRole = (role as UserRole) || UserRole.User;
        if (!Object.values(UserRole).includes(userRole)) {
          throw new Error(`Invalid role for email ${email}`);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error(`User with email ${email} already exists`);
        }

        const employeeId = await generateEmployeeId();

        const user = new User({
          name,
          email,
          role: userRole,
          status: UserStatus.Pending,
          createdBy: createdBy._id,
          employee_id: employeeId,
        });

        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
        await sendInvitationEmail(user.email, token);
      } catch (error: any) {
        if (error instanceof Error) {
          errors.push(`Error processing email ${row['email']}: ${error.message}`);
        } else {
          errors.push(`Unknown error processing email ${row['email']}`);
        }
      } finally {
        // Resume the stream after processing
        stream.resume();
      }
    })
      .on('end', () => {
        if (errors.length > 0) {
          reject(new Error(errors.join(', ')));
        } else {
          resolve();
        }
      })
      .on('error', (err) => {
        reject(new Error(`Failed to read CSV file: ${err.message}`));
      });
  });
};

// Admin: View All Users with Filters and Pagination
export const getAllUsers = async (input: {
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: IUser[]; total: number }> => {
  const { role, status, department, search, page = 1, limit = 10 } = input;
  const query: any = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  const total = await User.countDocuments(query).exec();

  return { users, total };
};

// Admin: Change User Role
export const changeUserRole = async (userId: string, newRole: UserRole): Promise<IUser> => {
  // Validate new role
  if (!Object.values(UserRole).includes(newRole)) {
    throw { status: 400, message: 'Invalid user role' };
  }

  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  user.role = newRole;
  await user.save();

  return user;
};

// Admin: Reset User Password
export const resetUserPassword = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  // Generate a password reset token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

  // Send password reset email
  await sendPasswordResetEmail(user.email, token);
};

// Admin: Export User Data as CSV
export const exportUserData = async (filters: {
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  search?: string;
}): Promise<string> => {
  const { role, status, department, search } = filters;
  const query: any = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (department) query.department = department;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query).exec();

  const fields = ['name', 'email', 'role', 'status', 'department', 'phone_number', 'employee_id'];
  const parser = new Parser({ fields });
  return parser.parse(users);
};

// === New Features ===

// Admin: Suspend User
export const suspendUser = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  if (user.status === UserStatus.Suspended) {
    throw { status: 400, message: 'User is already suspended' };
  }

  user.status = UserStatus.Suspended;
  await user.save();

  // Optionally, send a notification to the user about suspension
  // await sendUserSuspensionNotification(user.email);

  return user;
};

// Admin: Reactivate User
export const reactivateUser = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  if (user.status !== UserStatus.Suspended) {
    throw { status: 400, message: 'User is not suspended' };
  }

  user.status = UserStatus.Active;
  await user.save();

  // Optionally, send a notification to the user about reactivation
  // await sendUserReactivationNotification(user.email);

  return user;
};

// Admin: Edit User Profile
export const editUserProfile = async (userId: string, updates: Partial<IUser>): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  // Prevent changing immutable fields
  const immutableFields = ['email', 'employee_id', 'role'];
  immutableFields.forEach((field) => {
    if (updates[field as keyof IUser]) {
      throw { status: 400, message: `Cannot change ${field}` };
    }
  });

  Object.assign(user, updates);
  await user.save();

  return user;
};
