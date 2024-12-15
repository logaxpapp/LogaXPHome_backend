// src/controllers/authController.ts
import { Request, Response } from 'express';
import {
  registerUser,
  verifyEmail,
  loginUser,
  getSetupAccountService, 
  setupAccountService,
  getAllLoggedInUsersService,
  changePassword,
  logoutUserById
} from '../services/authService';
import Session from '../models/Session';
import User from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const message = await registerUser(req.body);
    res.status(201).json({ message });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

export const verifyEmailHandler = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const message = await verifyEmail(token);
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || 'Invalid or expired token' });
  }
};


// src/controllers/authController.ts
export const login = async (req: Request, res: Response) => {
  try {
    console.log('Incoming Headers:', req.headers); // Log all headers
    console.log('CSRF Token from Header:', req.headers['x-csrf-token']);
    const { email, password } = req.body;

    console.log('Incoming Request:', req.body); // Log incoming request

    // Authenticate user and generate token
    const { token, expiresIn } = await loginUser({ email, password });

    const user = await User.findOne({ email }).select('-password_hash');
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Update last login time
    await user.recordLogin();

    // Create or update active session
    await Session.findOneAndUpdate(
      { userId: user._id },
      { isActive: true, lastAccessed: new Date() },
      { upsert: true }
    );

    // Set the token in a secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour in milliseconds
    });

    // Return user data with token
    const userWithToken = user.toObject();
    userWithToken.token = token;
    userWithToken.expiresIn = expiresIn;

    res.status(200).json({ user: userWithToken });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};



export const logout = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Clear token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Use recordLogout method for session handling
    await req.user.recordLogout();

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to log out' });
  }
};



// GET: Handle setup-account link
export const getSetupAccount = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    const userData = await getSetupAccountService(token as string);

    res.status(200).json(userData);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || 'Invalid or expired token' });
  }
};

// POST: Handle account setup form submission
export const setupAccount = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    await setupAccountService(token, password);

    res.status(200).json({ message: 'Account setup completed successfully' });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || 'Error setting up account' });
  }
};


export const getAllLoggedInUsers = async (req: Request, res: Response) => {
  try {
    const { start, end, page = 1, limit = 10 } = req.query;

    // Parse query parameters
    const startDate = start ? new Date(start as string) : undefined;
    const endDate = end ? new Date(end as string) : undefined;
    const currentPage = parseInt(page as string, 10) || 1; // Ensure page is a number
    const itemsPerPage = parseInt(limit as string, 10) || 10; // Ensure limit is a number

    const { users, totalUsers } = await getAllLoggedInUsersService(
      startDate,
      endDate,
      currentPage,
      itemsPerPage
    );

    res.status(200).json({
      users,
      totalUsers,
      currentPage,
      totalPages: Math.ceil(totalUsers / itemsPerPage),
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


export const changePasswordHandler = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new passwords are required.' });
      return;
    }

    // Convert ObjectId to string
    const userId = req.user!._id.toString();

    const message = await changePassword(userId, currentPassword, newPassword);
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error.' });
  }
};


export const adminLogoutUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      res.status(400).json({ message: 'User ID is required.' });
      return;
    }

    // Logout the user
    await logoutUserById(userId);

    res.status(200).json({ message: 'User logged out successfully.' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

