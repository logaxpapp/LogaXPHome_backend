// src/types/guards.ts

import { IUser } from '../models/User';
import mongoose from 'mongoose';

/**
 * Type guard to check if a variable is of type IUser.
 * @param user - The user object to check.
 * @returns True if user is IUser, false otherwise.
 */
export function isIUser(user: mongoose.Types.ObjectId | IUser): user is IUser {
  return (user as IUser).email !== undefined;
}
