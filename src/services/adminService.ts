// src/services/adminService.ts

import User, { IUser } from '../models/User';
import { UserRole, UserStatus, Application } from '../types/enums';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  sendAccountDeletionNotification,
  sendInvitationEmail,
  sendPasswordResetEmail,
  notifyAdminsOfDeletionRequest,
} from '../utils/email';
import csv from 'csv-parser';
import fs from 'fs';
import { Parser } from 'json2csv';

interface CreateUserInput {
  name: string;
  email: string;
  role?: UserRole;
  password?: string;
  applications_managed?: Application[]; // Include applications_managed here
  // Add other fields as necessary
}

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



// Admin: Create User and Send Invite
export const createUserAndSendInvite = async (
  input: CreateUserInput,
  createdBy: IUser
): Promise<IUser> => {
  // Validate role and other fields as needed

  const userRole: UserRole = input.role || UserRole.User;

  // Generate employee ID and password hash
  const employeeId = await generateEmployeeId();
  const passwordHash = await bcrypt.hash(input.password || 'DefaultPassword123', 10);

  // Create new user
  const user = new User({
    name: input.name,
    email: input.email,
    role: userRole,
    status: UserStatus.Pending,
    createdBy: createdBy._id,
    employee_id: employeeId,
    password_hash: passwordHash,
    applications_managed: input.applications_managed, // Include applications_managed
    // Include other fields as necessary
  });

  await user.save();

  // Send invitation email
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
  const { role, status, department, search, page = 1, limit } = input; // Removed default `limit = 10`
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
    .skip((page - 1) * (limit || 0)) // Skip only if limit is provided
    .limit(limit || 0) // If no limit, return all users
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
  const immutableFields = ['email', 'employee_id'];
  immutableFields.forEach((field) => {
    if (updates[field as keyof IUser]) {
      throw { status: 400, message: `Cannot change ${field}` };
    }
  });

  Object.assign(user, updates);
  await user.save();

  return user;
};


// Update User Profile Service Function
export const updateUserProfile = async (userId: string, updates: Partial<IUser>): Promise<IUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  // Define immutable fields that cannot be updated
  const immutableFields = ['email', 'employee_id'];
  for (const field of immutableFields) {
    if (updates[field as keyof IUser]) {
      throw { status: 400, message: `Cannot change the field: ${field}` };
    }
  }

  // Assign valid updates to user
  Object.assign(user, updates);
  await user.save();  // Save the updated user

  return user;
};
 


export const adminDeleteUser = async (userId: string): Promise<void> => {
  console.log(`Attempting to delete user with ID: ${userId}`);

  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.log(`Invalid user ID format: ${userId}`);
    throw { status: 400, message: 'Invalid user ID format.' };
  }

  const user = await User.findById(userId);
  console.log(`User found: ${user ? user.name : 'No user found'}`);

  if (!user) {
    throw { status: 404, message: 'User not found.' };
  }

  await User.findByIdAndDelete(userId);
  console.log(`User with ID ${userId} has been deleted.`);

  // Notify the user about the account deletion
  await notifyUserAccountDeleted(user);
};

const notifyUserAccountDeleted = async (user: any) => {
  // Implement notification logic here
  console.log(`Notification sent to user: ${user.email}`);
};
