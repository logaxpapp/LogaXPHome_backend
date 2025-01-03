// src/services/subContractorService.ts

import User, { IUser } from '../models/User';
import { UserRole } from '../types/enums';

/**
 * Generates a unique contractor ID in the format CONTRA-0001, CONTRA-0002, etc.
 */
export const generateEmployeeId = async (): Promise<string> => {
    try {
      // Find the SubContractor with the highest employee_id
      const lastSub = await User.findOne({
        role: UserRole.SubContractor,
        employee_id: { $regex: /^CONTRA-\d{4}$/ },
      })
        .sort({ employee_id: -1 })
        .exec();
  
      if (!lastSub || !lastSub.employee_id) {
        return 'CONTRA-0001';
      }
  
      // Extract the numeric part of the employee_id
      const lastIdNumber = parseInt(lastSub.employee_id.replace('CONTRA-', ''), 10);
  
      // Handle NaN cases
      if (isNaN(lastIdNumber)) {
        throw new Error('Invalid employee_id format in the database.');
      }
  
      const newIdNumber = lastIdNumber + 1;
  
      // Ensure the new ID is zero-padded to maintain consistency (e.g., CONTRA-0002)
      return `CONTRA-${newIdNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      throw new Error('Failed to generate a unique employee ID.');
    }
  };
/**
 * Create a new SubContractor under a specific manager.
 * @param managerId - The ID of the manager creating the SubContractor.
 * @param data - Partial user data for the SubContractor.
 * @returns The created SubContractor user document.
 */
export const createSubContractor = async (
    managerId: string,
    data: Partial<IUser>
  ): Promise<IUser> => {
    // Ensure the manager exists and is either Admin or Contractor
    const manager = await User.findById(managerId);
    if (!manager) {
      throw new Error('Manager not found.');
    }
  
    if (![UserRole.Admin, UserRole.Contractor].includes(manager.role)) {
      throw new Error('Only Admins and Contractors can create SubContractors.');
    }
  
    // Check if email already exists
    if (data.email) {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error('Email already in use.');
      }
    } else {
      throw new Error('Email is required.');
    }
  
    // Generate unique employee_id
    const employee_id = await generateEmployeeId();
  
    // Assign the manager and employee_id to the SubContractor
    const subContractor = new User({
      ...data,
      role: UserRole.SubContractor,
      manager: manager._id,
      employee_id,
    });
  
    return subContractor.save();
  };
/**
 * Get all SubContractors under a specific manager.
 */
export const getSubContractorsByManager = async (managerId: string): Promise<IUser[]> => {
  return User.find({ manager: managerId, role: UserRole.SubContractor }).populate('manager');
};

/**
 * Get a SubContractor by ID, ensuring they belong to the requesting manager.
 */
export const getSubContractorById = async (managerId: string, subContractorId: string): Promise<IUser | null> => {
  return User.findOne({ _id: subContractorId, manager: managerId, role: UserRole.SubContractor }).populate('manager');
};

/**
 * Update a SubContractor's details.
 */
export const updateSubContractor = async (managerId: string, subContractorId: string, updates: Partial<IUser>): Promise<IUser | null> => {
  // Ensure the SubContractor belongs to the manager
  const subContractor = await User.findOneAndUpdate(
    { _id: subContractorId, manager: managerId, role: UserRole.SubContractor },
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('manager');

  return subContractor;
};

/**
 * Delete a SubContractor.
 */
export const deleteSubContractor = async (managerId: string, subContractorId: string): Promise<boolean> => {
  const result = await User.deleteOne({ _id: subContractorId, manager: managerId, role: UserRole.SubContractor });
  return result.deletedCount === 1;
};
