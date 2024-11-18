// src/controllers/approvalController.ts

import { Request, Response } from 'express';
import {
  createApprovalRequestService,
  getAllApprovalRequestsService,
  getUserApprovalRequestsService,
  getApprovalRequestByIdService,
  updateApprovalRequestStatusService,
  deleteApprovalRequestService,
  getUserPendingApprovalsService,
} from '../services/approvalService';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { UserRole } from '../types/enums';
import { IUser } from '../models/User';
import AuditLog from '../models/AuditLog';
import path from 'path';
import fs from 'fs';

/**
 * Type guard to check if a variable is an instance of Error
 */
const isError = (error: unknown): error is Error => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

// Extend Request interface to include user and file
interface AuthenticatedRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

/**
 * Controller: Create a new approval request.
 */
export const createApprovalRequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { request_type, request_details, workflow } = req.body;
  let { request_data } = req.body;

  try {
    let receiptPath: string | undefined = undefined;

    // Handle file upload if Expense type and file is present
    if (request_type === 'Expense' && authReq.file) {
      // Define the directory to store uploaded files
      const uploadDir = path.join(__dirname, '..', 'uploads', 'receipts');

      // Ensure the directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Define the file path
      const fileName = `${Date.now()}_${authReq.file.originalname}`;
      const filePath = path.join(uploadDir, fileName);

      // Save the file to the local filesystem
      fs.writeFileSync(filePath, authReq.file.buffer);

      // Set the relative path to store in the database
      receiptPath = path.join('uploads', 'receipts', fileName);
    }

    // Create approval request via service
    const approvalRequest = await createApprovalRequestService({
      user: authReq.user!._id,
      request_type,
      request_details,
      request_data,
      workflow,
      receiptPath,
    });

    res.status(201).json({ message: 'Approval request created successfully', data: approvalRequest });
  } catch (error) {
    console.error('Error creating approval request:', error);

    // If a file was uploaded but an error occurred, delete the file to prevent orphaned files
    if ((isError(error) && error.message !== 'Approval request created successfully') && authReq.file) {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'receipts');
      const fileName = `${Date.now()}_${authReq.file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (isError(error)) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

/**
 * Controller: Get all approval requests (Admin only).
 */
export const getAllApprovalRequestsHandler = async (req: Request, res: Response): Promise<void> => {
  const { page = '1', limit = '10', status, request_type } = req.query;

  const filters: any = {};
  if (status) filters.status = status;
  if (request_type) filters.request_type = request_type;

  const pagination = {
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
  };

  try {
    const { data, total, page: currentPage, pages } = await getAllApprovalRequestsService(filters, pagination);
    res.status(200).json({ data, total, page: currentPage, pages });
  } catch (error) {
    if (isError(error)) {
      console.error('Error fetching all approval requests:', error);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Error fetching all approval requests:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

/**
 * Controller: Get user's own approval requests.
 */
export const getUserApprovalRequestsHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;

  try {
    // Access `_id` and `role` directly from `authReq.user`
    const approvalRequests = await getUserApprovalRequestsService(authReq.user!._id, authReq.user!.role);
    res.status(200).json({ data: approvalRequests });
  } catch (error) {
    if (isError(error)) {
      console.error('Error fetching user approval requests:', error);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Error fetching user approval requests:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

export const getUserPendingApprovalsHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Optional: Additional runtime validation
    if (!mongoose.Types.ObjectId.isValid(authReq.user!._id)) {
      res.status(400).json({ message: 'Invalid user ID.' });
      return;
    }

    const approvals = await getUserPendingApprovalsService(authReq.user!._id);
    res.status(200).json({ data: approvals });
  } catch (error) {
    if (isError(error)) {
      console.error('Error fetching user pending approvals:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch user pending approvals.' });
    } else {
      console.error('Error fetching user pending approvals:', error);
      res.status(500).json({ message: 'Failed to fetch user pending approvals.' });
    }
  }
};

/**
 * Controller: Get approval request by ID.
 */
export const getApprovalRequestByIdHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    const approvalRequest = await getApprovalRequestByIdService(id);

    // Null check for TypeScript safety
    if (!approvalRequest) {
      res.status(404).json({ message: 'Approval request not found' });
      return;
    }

    // Check permissions
    const isOwner = approvalRequest.user._id.toString() === authReq.user!._id.toString();
    const isAdmin = authReq.user!.role === UserRole.Admin; // Use enum for type-safe comparison
    const isApprover = approvalRequest.steps.some(
      (step) => step.approver.toString() === authReq.user!._id.toString()
    );

    if (!isOwner && !isAdmin && !isApprover) {
      res.status(403).json({ message: 'Access forbidden: insufficient rights' });
      return;
    }

    res.status(200).json({ data: approvalRequest });
  } catch (error) {
    if (isError(error)) {
      console.error('Error fetching approval request by ID:', error);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Error fetching approval request by ID:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};

/**
 * Controller: Update approval request status (Approve/Reject) and optionally add a new step.
 */
export const updateApprovalRequestStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const { action, status, comments, newApproverId, stepName } = req.body;

  try {
    // Extract the user's ID and role
    const updaterId = authReq.user!._id;
    const updaterRole = authReq.user!.role; // Get the role of the authenticated user

    // Call the service and pass updaterRole along with the other parameters
    const updatedApprovalRequest = await updateApprovalRequestStatusService(
      id,
      updaterId,
      {
        action,
        status,
        comments,
        newApproverId: newApproverId ? new mongoose.Types.ObjectId(newApproverId) : undefined,
        stepName,
      },
      updaterRole // Pass the user's role to the service
    );

    res.status(200).json({
      message: 'Approval request updated successfully',
      data: updatedApprovalRequest,
    });
  } catch (error) {
    if (isError(error)) {
      console.error('Error updating approval request status:', error);
      res.status(500).json({
        message: error.message || 'Internal Server Error',
      });
    } else {
      console.error('Error updating approval request status:', error);
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
};

/**
 * Controller: Delete approval request (Admin only).
 */
export const deleteApprovalRequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const message = await deleteApprovalRequestService(id);
    res.status(200).json({ message });
  } catch (error) {
    if (isError(error)) {
      console.error('Error deleting approval request:', error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    } else {
      console.error('Error deleting approval request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
