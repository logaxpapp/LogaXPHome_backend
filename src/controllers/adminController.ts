// src/controllers/adminController.ts

import { Request, Response, NextFunction } from 'express';
import {
  getAllDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest,
  createUserAndSendInvite,
  bulkCreateUsersFromCSV,
  getAllUsers,
  changeUserRole,
  resetUserPassword,
  exportUserData,
  suspendUser,
  reactivateUser,
  editUserProfile,
  adminDeleteUser,
  updateUserProfile,
  
} from '../services/adminService';
import { requestAccountDeletion,   getEmployees,  } from '../services/userService';
import { UserRole, UserStatus, Application } from '../types/enums';
import multer from 'multer';

// Configure Multer for CSV uploads
const upload = multer({ dest: 'uploads/csv/' });

// Get All Deletion Requests
export const getDeletionRequestsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await getAllDeletionRequests();
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// Approve Deletion Request
export const approveDeletionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    await approveDeletionRequest(id);
    res.status(200).json({ message: 'Account deletion approved and user removed' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// Reject Deletion Request
export const rejectDeletionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    await rejectDeletionRequest(id);
    res.status(200).json({ message: 'Account deletion request rejected' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// Create User and Send Invite
export const createUserAndSendInviteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, role, applications_managed } = req.body;

    // Validate applications_managed
    if (applications_managed) {
      const validApplications = Object.values(Application) as string[];
      for (const app of applications_managed) {
        if (!validApplications.includes(app)) {
          res.status(400).json({ message: `Invalid application: ${app}` });
          return;
        }
      }
    }

    const user = await createUserAndSendInvite(
      { name, email, role, applications_managed },
      req.user!
    );
    res
      .status(201)
      .json({ message: 'User created and invitation sent', user });
  } catch (error: any) {
    res
      .status(error.status || 500)
      .json({ message: error.message || 'Server error' });
  }
};

// Bulk Create Users from CSV
export const bulkCreateUsersFromCSVHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = req.file?.path;
    if (!filePath) {
      res.status(400).json({ message: 'CSV file is required' });
      return;
    }

    await bulkCreateUsersFromCSV(filePath, req.user!);
    res.status(200).json({ message: 'Bulk user creation successful' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Bulk creation failed' });
  }
};

// Get All Users with Filters and Pagination
export const getAllUsersHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, department, search, page, limit } = req.query;

    const usersData = await getAllUsers({
      role: role as UserRole,
      status: status as UserStatus,
      department: department as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.status(200).json(usersData);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// Change User Role
export const changeUserRoleHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!id || !role) {
      res.status(400).json({ message: 'User ID and new role are required' });
      return;
    }

    const updatedUser = await changeUserRole(id, role as UserRole);
    res.status(200).json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// Reset User Password
export const resetUserPasswordHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    await resetUserPassword(id);
    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// Export User Data as CSV
export const exportUserDataHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, department, search } = req.query;

    const csvData = await exportUserData({
      role: role as UserRole,
      status: status as UserStatus,
      department: department as string,
      search: search as string,
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('users_export.csv');
    res.send(csvData);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// === New Features ===

// Suspend User
export const suspendUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const user = await suspendUser(id);
    res.status(200).json({ message: 'User suspended successfully', user });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// Reactivate User
export const reactivateUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const user = await reactivateUser(id);
    res.status(200).json({ message: 'User reactivated successfully', user });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// ADin Edit User Profile
export const editUserProfileHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const user = await editUserProfile(id, updates);
    res.status(200).json({ message: 'User profile updated successfully', user });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


// Remove immutable fields in the controller before calling the service
export const updateUserProfileHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  // Remove immutable fields
  delete updates.email;
  delete updates.employee_id;
  delete updates.role;

  try {
    const user = await updateUserProfile(id, updates);
    res.status(200).json({ message: 'User profile updated successfully', user });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};


export const requestAccountDeletionHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id; // req.user is set by authentication middleware
  const { reason } = req.body; // Extract reason from request body

  if (!reason) {
    res.status(400).json({ message: 'Reason for account deletion is required.' });
    return;
  }

  try {
    const user = await requestAccountDeletion(req.user!._id); // Changed from userId to _id
    res.status(200).json({ message: 'Account deletion requested successfully.', user });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Server error.' });
  }
};


export const adminDeleteUserHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id; // Changed from userId to id

  console.log(`Received request to delete user with ID: ${userId}`);

  try {
    await adminDeleteUser(userId);
    res.status(200).json({ message: 'User deleted successfully by admin.' });
  } catch (error: any) {
    console.error(`Error deleting user with ID ${userId}:`, error);
    res.status(error.status || 500).json({ message: error.message || 'Server error.' });
  }
};


export const fetchEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Fetching employees...');
    const employees = await getEmployees();
    console.log('Employees fetched:', employees);
    res.status(200).json(employees);
  } catch (error: any) {
    console.error('Error fetching employees:', error.message);
    next(error); // Pass error to centralized error handler
  }
};
