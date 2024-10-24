// src/middlewares/authorizeRoles.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { IUser, UserRole } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

export const authorizeRoles = (...roles: UserRole[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied' });
      return; // Prevent further execution
    }
    next();
  };
};
