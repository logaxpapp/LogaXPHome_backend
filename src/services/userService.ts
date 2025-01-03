// src/services/userService.ts

import { Application, UserRole, UserStatus } from '../types/enums'; 
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, notifyAdminsOfDeletionRequest } from '../utils/email';
import mongoose from 'mongoose';


// Interface for updating profile, including address
interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface UpdateProfileInput {
  name?: string;
  email?: string;
  job_title?: string;
  applications_managed?: Application[];
  department?: string;
  phone_number?: string;
  profile_picture_url?: string;
  date_of_birth?: Date;
  employment_type?: string;
  address?: IAddress; // Optional address
}

// Get user profile details
export const getProfile = async (user: IUser) => {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    applications_managed: user.applications_managed,
    job_title: user.job_title,
    profile_picture_url: user.profile_picture_url,
    department: user.department,
    phone_number: user.phone_number,
    address: user.address,
    date_of_birth: user.date_of_birth,
    employment_type: user.employment_type,
    onboarding_steps_completed: user.onboarding_steps_completed,
  };
};

interface CreateUserInput {
  name: string;
  email: string;
  
  password?: string;
  // Add applications_managed here
  applications_managed?: Application[];
}

// Interface for updating password
interface UpdatePasswordInput {
  current_password: string;
  new_password: string;
}

// Update user profile details
export const updateProfile = async (user: IUser, input: UpdateProfileInput): Promise<IUser> => {

  const { 
    name, 
    email, 
    job_title, 
    applications_managed, 
    department, 
    phone_number, 
    address, 
    profile_picture_url, 
    date_of_birth, 
    employment_type 
  } = input;

  // Handle email change with re-verification only if the email is actually changing
  if (email && email !== user.email) {
    // Check if another user already has this email
    const existingUser = await User.findOne({ email });
    
    // Only throw an error if the email belongs to a different user
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      console.log(`Conflict: Email ${email} already in use by user with ID ${existingUser._id}`);
      throw { status: 400, message: 'Email already in use' };
    }
    user.email = email;
    user.status = UserStatus.Pending; // Email change requires re-verification

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
    await sendVerificationEmail(user.email, token);
  }

  // Update other fields
  if (name) user.name = name;
  if (job_title) user.job_title = job_title;
  if (applications_managed) user.applications_managed = applications_managed;
  if (department) user.department = department;
  if (phone_number) user.phone_number = phone_number;

  if (address) {
    if (!user.address) {
      user.address = {};
      console.log('Initializing empty address for user');
    }
    if (address.street !== undefined) user.address.street = address.street;
    if (address.city !== undefined) user.address.city = address.city;
    if (address.state !== undefined) user.address.state = address.state;
    if (address.zip !== undefined) user.address.zip = address.zip;
    if (address.country !== undefined) user.address.country = address.country;
  }

  if (profile_picture_url) user.profile_picture_url = profile_picture_url;
  if (date_of_birth) user.date_of_birth = date_of_birth;
  if (employment_type) user.employment_type = employment_type;

  await user.save();

  return user;
};



// Update user password with current password check
export const updatePassword = async (user: IUser, input: UpdatePasswordInput) => {
  const { current_password, new_password } = input;

  const isMatch = await user.comparePassword(current_password);
  if (!isMatch) {
    throw { status: 400, message: 'Current password is incorrect' };
  }

  user.password_hash = new_password; // Hashed in the pre-save hook
  await user.save();
};

// Request account deletion (marks the user for admin approval)
/**
 * Request account deletion by marking the user as PendingDeletion.
 * @param userId - The ID of the user requesting deletion.
 */


export const requestAccountDeletion = async (
  userId: mongoose.Types.ObjectId,
  reason: string
): Promise<IUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw { status: 404, message: 'User not found.' };
  }

  if (user.status === UserStatus.PendingDeletion) {
    throw { status: 400, message: 'Account deletion is already pending approval.' };
  }

  user.status = UserStatus.PendingDeletion;
  user.deletionReason = reason; // Save the reason for the request
  await user.save();

  // Notify admins about the deletion request
  await notifyAdminsOfDeletionRequest(user);

  return user;
};


export const getEmployees = async () => {
  return await User.find({ employee_id: { $exists: true, $ne: null } }) 
    .select('_id name employee_id') 
    .lean(); // Improve performance by skipping full document hydration
};

//Get user by Id 
export const getUserById = async (userId: mongoose.Types.ObjectId): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found.' };
  }
  return user;
}


export const acknowledgePolicy = async (userId: mongoose.Types.ObjectId, resourceId: mongoose.Types.ObjectId): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: 'User not found.' };
  }

  if (!user.acknowledgedPolicies) {
    user.acknowledgedPolicies = [];
  }

  if (!user.acknowledgedPolicies.includes(resourceId)) {
    user.acknowledgedPolicies.push(resourceId);
    await user.save();
  }

  return user;
};



