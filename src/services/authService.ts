// src/services/authService.ts
import User from '../models/User';
import { UserRole, UserStatus } from '../types/enums';
import { IUser } from '../models/User';
import { sendVerificationEmail, passwordResetEmail } from '../utils/email';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Session from '../models/Session';

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
  role: string;
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

interface LoginOutput {
  token: string;
  expiresIn: string;
}
export const registerUser = async (input: RegisterInput): Promise<string> => {
  const {
    name,
    email,
    password,
    role, // Accept role explicitly
    job_title,
    applications_managed,
    department,
    phone_number,
    address,
    date_of_birth,
    employment_type,
  } = input;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw { status: 400, message: 'Email already registered' };
  }

  // Assign role based on job_title or applications_managed
  const determinedRole = determineUserRole(job_title, applications_managed, role); 

  // Validate and parse date_of_birth
  let validDateOfBirth: Date | undefined = undefined;
  if (date_of_birth) {
    const parsedDate = new Date(date_of_birth);
    if (!isNaN(parsedDate.getTime())) {
      validDateOfBirth = parsedDate;
    } else {
      throw { status: 400, message: 'Invalid date_of_birth format' };
    }
  }

  // Create user with input data
  const user = new User({
    name,
    email,
    password_hash: password, // Will be hashed by pre-save hook
    role: determinedRole,
    applications_managed,
    job_title,
    status: 'Pending',
    employee_id: generateEmployeeId(), // Implement this function as needed
    department,
    phone_number,
    address, // Pass address from input
    date_of_birth: validDateOfBirth, // Assign only if valid
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

// src/services/authService.ts
export const loginUser = async (input: LoginInput): Promise<LoginOutput> => {
  const { email, password } = input;

  const user = await User.findOne({ email });
if (!user) {
  console.error('User not found or email is invalid');
  throw { status: 400, message: 'Invalid email or password' };
}

console.log('User fetched from database:', user);

if (!user.comparePassword) {
  console.error('comparePassword method is missing or undefined');
  throw { status: 500, message: 'comparePassword method is not available on user document' };
}

const isMatch = await user.comparePassword(password);
if (!isMatch) {
  throw { status: 400, message: 'Invalid email or password' };
}


  // Password expiration logic
  const PASSWORD_EXPIRATION_DAYS = 180; // 6 months
  const passwordChangedAt = user.passwordChangedAt || user.createdAt; // Fallback to account creation date
  const passwordAgeInMs = Date.now() - passwordChangedAt.getTime();
  const passwordAgeInDays = passwordAgeInMs / (1000 * 60 * 60 * 24);

  if (passwordAgeInDays >= PASSWORD_EXPIRATION_DAYS) {
    throw {
      status: 403,
      message: 'Your password has expired. Please change your password.',
    };
  }

  // Generate JWT token
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const expiresIn = '2h'; // Token expiration
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn,
  });

  // Update or create an active session
  await Session.findOneAndUpdate(
    { userId: user._id },
    { isActive: true, lastAccessed: new Date() },
    { upsert: true }
  );

  return { token, expiresIn };
};

const determineUserRole = (
  job_title?: string,
  applications_managed: string[] = [],
  explicitRole?: string
): string => {
  if (explicitRole) return explicitRole; // Prioritize explicit role
  if (job_title && job_title.toLowerCase().includes('admin')) return 'admin';
  if (applications_managed.length > 0) return 'support';
  return 'user';
};


// Simple Employee ID generator
const generateEmployeeId = (): string => {
  return 'EMP-' + Math.floor(1000 + Math.random() * 9000).toString();
};


// Service: Get setup account details
export const getSetupAccountService = async (token: string) => {
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Find the user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Return user info to prefill the form (like email and name)
    return { email: user.email, name: user.name };
  } catch (error) {
    throw { status: 400, message: 'Invalid or expired token' };
  }
};

// Service: Setup user account
export const setupAccountService = async (token: string, password: string) => {
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Find the user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update the user's password and status to active
    user.password_hash = passwordHash;
    user.status = UserStatus.Active;  
    await user.save();
  } catch (error) {
    throw { status: 400, message: 'Error setting up account' };
  }
};

export const getAllLoggedInUsersService = async (
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  limit: number = 10
) => {
  const filter: Record<string, any> = { isActive: true };

  // Filter sessions by lastAccessed if date range is provided
  if (startDate || endDate) {
    filter.lastAccessed = {};
    if (startDate) filter.lastAccessed.$gte = startDate;
    if (endDate) filter.lastAccessed.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  // Find active sessions and populate user data
  const activeSessions = await Session.find(filter)
    .populate<{ userId: IUser }>('userId', '_id name email role status lastAccessed') // Ensure proper typing for populated field
    .skip(skip)
    .limit(limit);

  const totalUsers = await Session.countDocuments(filter);

  // Extract user data safely
  const users = activeSessions.map((session) => {
    const user = session.userId as IUser; // Explicitly cast `userId` to `IUser`
    return {
      ...user.toObject(), // Convert Mongoose Document to plain object
      lastAccessed: session.lastAccessed, // Add session-specific data if needed
    };
  });

  return { users, totalUsers };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<string> => {
  const user = await User.findById(userId);

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw { status: 400, message: 'Current password is incorrect' };
  }

  // Check if the new password has been used before
  const isReused = await user.isPasswordReused(newPassword);
  if (isReused) {
    throw { status: 400, message: 'New password must not match any of your last 5 passwords' };
  }

  // Update password (the middleware hashes it before saving)
  user.password_hash = newPassword;
  await user.save();

  return 'Password updated successfully';
};


export const logoutUserById = async (userId: string) => {
  // Invalidate all active sessions for the user
  await Session.updateMany({ userId, isActive: true }, { isActive: false });

  // Optionally, perform other cleanup tasks, such as revoking tokens
};

/**
 * requestPasswordResetService
 * 1) Find user by email
 * 2) Generate a secure token & expiration
 * 3) Save to user.resetPasswordToken & user.resetPasswordTokenExpires
 * 4) Send email with link or code
 */
export const requestPasswordResetService = async (email: string) => {
  // 1) Lookup user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw { status: 404, message: 'No user found with that email address' };
  }

  // 2) Generate a random token (32 bytes, hex-encoded)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Set token to expire in e.g., 15 minutes
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  // 3) Save these to the user document
  user.resetPasswordToken = resetToken;
  user.resetPasswordTokenExpires = expires;
  await user.save();

  // 4) Send email with link or code
  // If your `sendPasswordResetEmail` expects a URL param like '?token=xyz', do:
  await passwordResetEmail(user.email, resetToken);

  return { message: 'Password reset email sent.' };
};

/**
 * resetPasswordService
 * 1) Validate token
 * 2) Check if token is expired
 * 3) Check if new password is reused
 * 4) Update password if valid
 */
export const resetPasswordService = async (token: string, newPassword: string) => {
  // 1) Look up user by token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordTokenExpires: { $gt: new Date() }, // not expired
  });

  if (!user) {
    throw { status: 400, message: 'Invalid or expired reset token' };
  }

  // 2) Check if the new password is reused
  const reused = await user.isPasswordReused(newPassword);
  if (reused) {
    throw {
      status: 400,
      message: 'New password must not match any of your last 5 passwords',
    };
  }

  // 3) Update the user’s password
  // The pre-save hook will push the old password to passwordHistory, and re-hash this one
  user.password_hash = newPassword;

  // Clear out the reset token fields
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpires = null;

  await user.save();

  return { message: 'Password has been reset successfully' };
};