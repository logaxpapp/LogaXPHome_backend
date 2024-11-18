// src/services/approvalService.ts

import mongoose from 'mongoose';
import {
  ApprovalRequestBase,
  LeaveApprovalRequest,
  ExpenseApprovalRequest,
  AppraisalApprovalRequest,
  OtherApprovalRequest,
} from '../models';
import { IUser } from '../models/User';
import { sendEmail } from '../utils/email';
import AuditLog from '../models/AuditLog';
import { UserRole } from '../types/enums';
import ApprovalRequest, { IApprovalRequestBase } from '../models/ApprovalRequest';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Interface for Workflow Step
interface WorkflowStep {
  step_name: string;
  approver: mongoose.Types.ObjectId;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// Create Approval Request Payload
interface CreateApprovalRequestPayload {
  user: mongoose.Types.ObjectId;
  request_type: string;
  request_details: string;
  request_data: any;
  workflow: WorkflowStep[];
  receiptPath?: string; // Local path to the receipt file (for Expense requests)
}

// Update Approval Request Status Payload
interface IProcessApprovalOptions {
  action: 'finalize' | 'add_step';
  status: 'Approved' | 'Rejected';
  comments?: string;
  newApproverId?: mongoose.Types.ObjectId;
  stepName?: string;
}

/**
 * Creates a new approval request based on the request type.
 * @param payload - Data required to create the approval request.
 * @returns The created approval request document.
 */
export const createApprovalRequestService = async (
  payload: CreateApprovalRequestPayload
): Promise<IApprovalRequestBase> => {
  const { user, request_type, request_details, request_data, workflow, receiptPath } = payload;

  // If there's a receipt path, attach it to request_data
  if (receiptPath) {
    request_data.receipt = receiptPath;
  }

  // Select the appropriate model based on request_type
  let ApprovalRequestModel;
  switch (request_type) {
    case 'Leave':
      ApprovalRequestModel = LeaveApprovalRequest;
      break;
    case 'Expense':
      ApprovalRequestModel = ExpenseApprovalRequest;
      break;
    case 'Appraisal':
      ApprovalRequestModel = AppraisalApprovalRequest;
      break;
    case 'Other':
      ApprovalRequestModel = OtherApprovalRequest;
      break;
    default:
      ApprovalRequestModel = ApprovalRequestBase;
  }

  // Instantiate the approval request
  const approvalRequest = new ApprovalRequestModel({
    user,
    request_type,
    request_details,
    request_data,
    steps: workflow.map((step, index) => ({
      step_name: step.step_name || `Step ${index + 1}`,
      approver: step.approver,
      status: 'Pending',
    })),
  });

  // Save to the database
  await approvalRequest.save();

  return approvalRequest;
};

/**
 * Retrieves all approval requests with optional filters and pagination.
 * @param filters - Filters to apply to the query.
 * @param pagination - Pagination parameters.
 * @returns An object containing the approval requests and pagination info.
 */
export const getAllApprovalRequestsService = async (
  filters: any,
  pagination: { page: number; limit: number }
): Promise<{ data: IApprovalRequestBase[]; total: number; page: number; pages: number }> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const approvalRequests = await ApprovalRequestBase.find(filters)
    .populate('user', 'name email')
    .populate('steps.approver', 'name email')
    .populate('history.approver', 'name email')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  const total = await ApprovalRequestBase.countDocuments(filters).exec();
  const pages = Math.ceil(total / limit);

  return { data: approvalRequests, total, page, pages };
};

/**
 * Retrieves approval requests for a specific user or approver based on role.
 * @param userId - The ID of the user making the request.
 * @param role - The role of the user ('User', 'Admin', 'Approver').
 * @returns A list of relevant approval requests.
 */
export const getUserApprovalRequestsService = async (
  userId: mongoose.Types.ObjectId,
  role: string
): Promise<IApprovalRequestBase[]> => {
  let query: any = {};

  if (role === UserRole.Admin) {
    // Admin can view all approval requests or apply additional filters if needed
    query = {};
  } else if (role === UserRole.Approver) {
    // Approver can view approval requests where they are in the workflow steps
    query = { 'steps.approver': userId };
  } else {
    // Regular user can view their own approval requests
    query = { user: userId };
  }

  const approvalRequests = await ApprovalRequestBase.find(query)
    .populate('user', 'name email')
    .populate('steps.approver', 'name email')
    .populate('history.approver', 'name email')
    .sort({ created_at: -1 })
    .exec();

  return approvalRequests;
};

/**
 * Retrieves a specific approval request by its ID.
 * @param requestId - The ID of the approval request.
 * @returns The approval request document if found.
 */
export const getApprovalRequestByIdService = async (requestId: string): Promise<IApprovalRequestBase | null> => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new Error('Invalid approval request ID');
  }

  const approvalRequest = await ApprovalRequestBase.findById(requestId)
    .populate('user', 'name email')
    .populate('steps.approver', 'name email')
    .populate('history.approver', 'name email')
    .exec();

  if (!approvalRequest) {
    throw new Error('Approval request not found');
  }

  return approvalRequest;
};
// src/services/approvalRequestService.ts


/**
 * Updates the status of an approval request (Approve/Reject) and optionally adds a new step.
 * @param requestId - The ID of the approval request.
 * @param updaterId - The ID of the user performing the update.
 * @param payload - The update payload containing action, status, comments, and optionally new step details.
 * @param updaterRole - The role of the user performing the update.
 * @returns The updated approval request document.
 */
export const updateApprovalRequestStatusService = async (
  requestId: string,
  updaterId: mongoose.Types.ObjectId,
  payload: IProcessApprovalOptions,
  updaterRole: string
): Promise<IApprovalRequestBase> => {
  const { action, status, comments, newApproverId, stepName } = payload;

  if (!['finalize', 'add_step'].includes(action)) {
    throw new Error('Invalid action.');
  }

  if (!['Approved', 'Rejected'].includes(status)) {
    throw new Error('Invalid status.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const approvalRequest = await ApprovalRequestBase.findById(requestId)
      .populate('user') // Populate the user field
      .populate('steps.approver') // Assuming steps have an approver field that references User
      .session(session)
      .exec();

    if (!approvalRequest) {
      throw new Error('Approval request not found.');
    }

    // Type Narrowing: Ensure that 'user' is populated
    if (!(approvalRequest.user instanceof mongoose.Types.ObjectId)) {
      // Now, approvalRequest.user is IUser
      const employeeEmail = approvalRequest.user.email;
      const employeeName = approvalRequest.user.name;

      // Proceed with your logic
      // ...

      // Example: Sending an email
      await sendEmail({
        to: employeeEmail,
        subject: `Your Approval Request has been ${status}`,
        text: `Hello ${employeeName},\n\nYour approval request has been ${status}.\n\nComments: ${comments}\n\nRegards,\nAdmin Team`,
        html: `<p>Hello <strong>${employeeName}</strong>,</p><p>Your approval request has been ${status}.</p><p>Comments: ${comments}</p><p>Regards,<br/>Admin Team</p>`,
      });
    } else {
      throw new Error('User information is not populated.');
    }

    // ... rest of your logic

    await session.commitTransaction();
    session.endSession();

    return approvalRequest;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in updateApprovalRequestStatusService:', error);
    throw error;
  }
};

/**
 * Deletes an approval request.
 * @param requestId - The ID of the approval request.
 * @returns A confirmation message upon successful deletion.
 */
export const deleteApprovalRequestService = async (requestId: string): Promise<string> => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new Error('Invalid approval request ID');
  }

  const approvalRequest = await ApprovalRequestBase.findById(requestId).exec();

  if (!approvalRequest) {
    throw new Error('Approval request not found');
  }

  // If there's a receipt file, delete it from the local storage
  if (approvalRequest.request_data?.receipt) {
    const receiptPath = path.join(__dirname, '..', approvalRequest.request_data.receipt);
    try {
      await unlinkAsync(receiptPath);
    } catch (err) {
      console.error('Error deleting receipt file:', err);
      // Proceed even if file deletion fails
    }
  }

  await ApprovalRequestBase.findByIdAndDelete(requestId).exec();

  return 'Approval request deleted successfully';
};

/**
 * Retrieves pending approval requests for a user.
 * @param userId - The ID of the user.
 * @returns An array of pending approval requests.
 */
export const getUserPendingApprovalsService = async (userId: mongoose.Types.ObjectId): Promise<IApprovalRequestBase[]> => {
  try {
    const approvals = await ApprovalRequestBase.find({
      status: 'Pending',
      user: userId,
    })
      .populate('user', 'name email')
      .populate('steps.approver', 'name email')
      .populate('history.approver', 'name email')
      .sort({ created_at: -1 })
      .exec();
    return approvals;
  } catch (error) {
    throw new Error('Failed to fetch user pending approvals.');
  }
};
