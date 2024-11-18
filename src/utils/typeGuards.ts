// src/utils/typeGuards.ts

import { IUser } from '../models/User';

/**
 * Type guard to check if an object is IUser
 */
export const isIUser = (obj: any): obj is IUser => {
  return obj && typeof obj === 'object' && 'email' in obj && 'name' in obj;
};
