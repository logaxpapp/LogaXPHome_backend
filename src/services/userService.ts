// src/services/userService.ts

import User, { IUser, UserStatus } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '../utils/email';

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
  applications_managed?: string[];
  department?: string;
  phone_number?: string;
  profile_picture_url?: string;
  date_of_birth?: Date;
  employment_type?: string;
  address?: IAddress; // Optional address
}

// Interface for updating password
interface UpdatePasswordInput {
  current_password: string;
  new_password: string;
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

// Update user profile details
export const updateProfile = async (user: IUser, input: UpdateProfileInput) => {
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

  // Handle email change with re-verification
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw { status: 400, message: 'Email already in use' };
    }

    user.email = email;
    user.status = UserStatus.Pending; // Email change requires re-verification

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
    await sendVerificationEmail(user.email, token);
  }

  if (name) user.name = name;
  if (job_title) user.job_title = job_title;
  if (applications_managed) user.applications_managed = applications_managed;
  if (department) user.department = department;
  if (phone_number) user.phone_number = phone_number;

  if (address) {
    // Initialize user.address if undefined
    if (!user.address) {
      user.address = {};
    }

    // Assign each address field individually if provided
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
export const requestAccountDeletion = async (user: IUser) => {
  user.status = UserStatus.PendingDeletion;
  await user.save();
  // Notify admin logic can be added here (e.g., through email)
};
