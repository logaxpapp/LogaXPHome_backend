// src/middlewares/authorizeRoles.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { IUser } from '../models/User';
import { UserRole } from '../types/enums';

interface AuthRequest extends Request {
  user?: IUser;
}

export const authorizeRoles = (...roles: UserRole[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('Authorization failed: No user attached to request.');
      res.status(403).json({ message: 'Access denied' });
      return; // Prevent further execution
    }

    // Log the user's role and the required roles
    console.log(`User Role: ${req.user.role}, Required Roles: ${roles.join(', ')}`);

    if (!roles.includes(req.user.role)) {
      console.log(`Access denied for user with role: ${req.user.role}`);
      res.status(403).json({ message: 'Access denied' });
      return; // Prevent further execution
    }

    console.log(`Access granted for user with role: ${req.user.role}`);
    next();
  };
};
