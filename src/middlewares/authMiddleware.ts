// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticateJWT: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.token;

  if (!token) {
    console.log('Authentication token missing.');
    res.status(401).json({ message: 'Authentication token missing' });
    return; // Ensure function returns void
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    console.log('Decoded JWT:', decoded);

    const userId = decoded.userId;

    if (!userId) {
      console.log('Invalid token payload: userId missing.');
      res.status(401).json({ message: 'Invalid token payload' });
      return; // Ensure function returns void
    }

    const user = await User.findById(userId).select('-password_hash');

    if (!user) {
      console.log(`User not found with ID: ${userId}`);
      res.status(401).json({ message: 'User not found' });
      return; // Ensure function returns void
    }

    req.user = user;

    console.log(`Authenticated User: ${user.name}, Role: ${user.role}`);

    next();
  } catch (error) {
    console.log('JWT Verification Failed:', error instanceof Error ? error.message : error);
    res.status(401).json({ message: 'Invalid or expired token' });
    return; // Ensure function returns void
  }
};
