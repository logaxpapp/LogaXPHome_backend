// src/controllers/changeRequestController.ts

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import {
  createChangeRequestService,
  getAllPendingChangeRequestsService,
  approveChangeRequestService,
  rejectChangeRequestService,
  deleteChangeRequestService,
  getUserChangeRequestsService,
  softDeleteChangeRequestService,
  getSoftDeletedChangeRequestsService,
  permanentlyDeleteChangeRequestService,
  restoreChangeRequestService,
} from '../services/changeRequestService';
import ChangeRequestApproval from '../models/ChangeRequestApproval';
import { IUser } from '../models/User';
import { UserRole } from '../types/enums';

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Handler to create a new change request
 */
export const createChangeRequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;

  // Check if user is authenticated
  if (!authReq.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { fields_to_change } = req.body;

  try {
    const changeRequest = await createChangeRequestService(authReq.user._id, fields_to_change);
    res.status(201).json({ message: 'Change request submitted successfully.', data: changeRequest });
  } catch (error: any) {
    console.error('Error creating change request:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Handler to get all change requests (Admin only)
 */
export const getAllChangeRequestsHandler = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
  
    // Check if user is admin
    if (!authReq.user || authReq.user.role !== UserRole.Admin) {
      res.status(403).json({ message: 'Forbidden: Admins only.' });
      return;
    }
  
    // Read query parameter
    const includeDeleted = req.query.includeDeleted === 'true'; // Default to `false`
  
    try {
      const changeRequests = await getAllPendingChangeRequestsService(includeDeleted);
      res.status(200).json({ data: changeRequests });
    } catch (error: any) {
      console.error('Error fetching change requests:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
/**
 * Handler to approve a change request (Admin only)
 */
export const approveChangeRequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const { comments } = req.body;

  // Check if user is admin
  if (!authReq.user || authReq.user.role !== UserRole.Admin) {
    res.status(403).json({ message: 'Forbidden: Admins only.' });
    return;
  }

  try {
    const resultMessage = await approveChangeRequestService(id, authReq.user._id, comments);
    res.status(200).json({ message: resultMessage });
  } catch (error: any) {
    console.error('Error approving change request:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Handler to reject a change request (Admin only)
 */
export const rejectChangeRequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const { comments } = req.body;

  // Check if user is admin
  if (!authReq.user || authReq.user.role !== UserRole.Admin) {
    res.status(403).json({ message: 'Forbidden: Admins only.' });
    return;
  }

  try {
    const resultMessage = await rejectChangeRequestService(id, authReq.user._id, comments);
    res.status(200).json({ message: resultMessage });
  } catch (error: any) {
    console.error('Error rejecting change request:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Handler to delete a change request (Admin only)
 */
export const deleteChangeRequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  // Check if user is admin
  if (!authReq.user || authReq.user.role !== UserRole.Admin) {
    res.status(403).json({ message: 'Forbidden: Admins only.' });
    return;
  }

  try {
    const resultMessage = await deleteChangeRequestService(id);
    res.status(200).json({ message: resultMessage });
  } catch (error: any) {
    console.error('Error deleting change request:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};


/**
 * Handler to get all change requests for a specific user (Admin or User)
 */
export const getMyChangeRequestsHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?._id?.toString();
  
      if (!userId) {
        res.status(400).json({ message: 'User ID is required.' });
        return;
      }
  
      const changeRequests = await getUserChangeRequestsService(userId, false); // Exclude deleted requests
      res.status(200).json({ data: changeRequests });
    } catch (error: any) {
      console.error('Error fetching user change requests:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  

  export const softDeleteChangeRequestHandler = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
  
    if (!reason) {
      res.status(400).json({ message: 'Reason for deletion is required.' });
      return;
    }
  
    try {
      const userId = req.user?._id?.toString();
      const changeRequest = await softDeleteChangeRequestService(userId!, id, reason);
      res.status(200).json({ message: 'Change request soft-deleted successfully.', data: changeRequest });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };
  
  export const getSoftDeletedChangeRequestsHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1; // Default to page 1
      const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page
  
      const { data, totalCount } = await getSoftDeletedChangeRequestsService(page, limit);
  
      res.status(200).json({
        data,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  

  export const permanentlyDeleteChangeRequestHandler = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const result = await permanentlyDeleteChangeRequestService(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };

  export const restoreChangeRequestHandler = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const result = await restoreChangeRequestService(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  };

  export const getChangeRequestByIdHandler = async (req: Request, res: Response) => {
    const { id } = req.params;
  
    try {
      const changeRequest = await ChangeRequestApproval.findById(id)
        .populate('user', 'name email')
        .lean();
  
      if (!changeRequest) {
        res.status(404).json({ message: 'Change request not found.' });
        return;
      }
  
      res.status(200).json(changeRequest);
    } catch (error: any) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  