// src/services/authService.ts
import User, { IUser, UserStatus } from '../models/User';
import { sendVerificationEmail } from '../utils/email';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  job_title: string;
  applications_managed: string[];
}
interface RegisterInput {
  name: string;
  email: string;
  password: string;
  job_title: string;
  applications_managed: string[];
  department: string;
  phone_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  date_of_birth: string;  // Use a string if you're passing a date from Postman
  employment_type: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput): Promise<string> => {
  const {
    name,
    email,
    password,
    job_title,
    applications_managed,
    department,
    phone_number,
    address,
    date_of_birth,
    employment_type
  } = input;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw { status: 400, message: 'Email already registered' };
  }

  // Assign role based on job_title or applications_managed
  const role = determineUserRole(job_title, applications_managed);

  // Create user with input data
  const user = new User({
    name,
    email,
    password_hash: password, // Will be hashed by pre-save hook
    role,
    applications_managed,
    job_title,
    status: 'Pending',
    employee_id: generateEmployeeId(), // Implement this function as needed
    department,
    phone_number,
    address, // Pass address from input
    date_of_birth: new Date(date_of_birth), // Convert string to Date
    employment_type,
    onboarding_steps_completed: [],
  });

  await user.save();

  // Create verification token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1d' });

  // Send verification email
  await sendVerificationEmail(user.email, token);

  return 'Registration successful. Please verify your email.';
};


export const verifyEmail = async (token: string): Promise<string> => {
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw { status: 400, message: 'User not found' };
    }

    if (user.status === 'Active') {
      throw { status: 400, message: 'Email already verified' };
    }

    user.status = UserStatus.Active;
    await user.save();

    return 'Email verified successfully';
  } catch (error) {
    throw { status: 400, message: 'Invalid or expired token' };
  }
};

export const loginUser = async (input: LoginInput): Promise<string> => {
  const { email, password } = input;

  const user = await User.findOne({ email });
  if (!user) {
    throw { status: 400, message: 'Invalid credentials' };
  }

  if (user.status !== 'Active') {
    throw { status: 400, message: 'Please verify your email before logging in' };
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw { status: 400, message: 'Invalid credentials' };
  }

  const payload = {
    user: {
      id: user.id,
      role: user.role,
    },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

  return token;
};

const determineUserRole = (job_title: string, applications_managed: string[]): string => {
  if (job_title.toLowerCase().includes('admin')) return 'admin';
  if (applications_managed.length > 0) return 'support';
  return 'user';
};

// Simple Employee ID generator
const generateEmployeeId = (): string => {
  return 'EMP-' + Math.floor(1000 + Math.random() * 9000).toString();
};
