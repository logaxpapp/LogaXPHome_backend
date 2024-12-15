
// src/services/changeRequestService.ts

import mongoose from 'mongoose';
import ChangeRequestApproval from '../models/ChangeRequestApproval';
import { IChangeRequestApproval, ChangeRequestAllowedFields } from '../types/changeRequest';
import User, { IUser, IAddress } from '../models/User';
import AuditLog from '../models/AuditLog';
import { sendEmailChangeMail } from '../utils/email';
import { createAuditLog } from '../utils/auditLogHelper';
import { UserRole } from '../types/enums';

/**
 * Helper function to transform ChangeRequestApproval document to IChangeRequestApproval
 */
const transformChangeRequest = (cr: any): IChangeRequestApproval => ({
  _id: cr._id.toString(),
  user: {
    _id: cr.user._id.toString(),
    name: cr.user.name,
    email: cr.user.email,
  },
  request_type: cr.request_type,
  request_details: cr.request_details,
  status: cr.status,
  current_step: cr.current_step,
  request_data: {
    fields_to_change: cr.request_data.fields_to_change,
    current_values: cr.request_data.current_values,
  },
  steps: cr.steps.map((step: any) => ({
    step_name: step.step_name,
    approver: {
      _id: step.approver._id.toString(),
      name: step.approver.name,
      email: step.approver.email,
    },
    status: step.status,
    decision_date: step.decision_date ? new Date(step.decision_date) : undefined,
    comments: step.comments,
  })),
  history: cr.history.map((historyItem: any) => ({
    step_name: historyItem.step_name,
    status: historyItem.status,
    decision_date: new Date(historyItem.decision_date),
    approver: historyItem.approver,
    comments: historyItem.comments,
  })),
  created_at: new Date(cr.created_at),
  updated_at: new Date(cr.updated_at),
});


  export const createChangeRequestService = async (
    userId: mongoose.Types.ObjectId,
    fieldsToChange: Partial<Record<ChangeRequestAllowedFields, string | number | Date | IAddress>>
  ): Promise<IChangeRequestApproval> => {
    const allowedFields: ChangeRequestAllowedFields[] = [
      'name',
      'email',
      'phone_number',
      'address',
      'profile_picture_url',
      'date_of_birth',
      'employment_type',
      'hourlyRate',
      'overtimeRate',
      'job_title',
      'department',
    ];
  
    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error('User not found.');
    }
  
    const validFields: Partial<Record<ChangeRequestAllowedFields, string | number | Date | IAddress>> = {};
    const currentValues: Partial<Record<ChangeRequestAllowedFields, string | number | Date | IAddress>> = {};
  
    for (const field of allowedFields) {
      if (fieldsToChange[field] !== undefined) {
        validFields[field] = fieldsToChange[field];
        currentValues[field] = user[field as keyof IUser] ?? undefined;
      }
    }
  
    if (Object.keys(validFields).length === 0) {
      throw new Error('No valid fields to change.');
    }
  
    const adminUser = await User.findOne({ role: UserRole.Admin, status: 'Active' }).exec();
    if (!adminUser) {
      throw new Error('No active admin user found to approve the change request.');
    }
  
    const changeRequest = new ChangeRequestApproval({
      user: userId,
      request_type: 'ChangeRequest',
      request_details: 'User Profile Change Request',
      request_data: {
        fields_to_change: validFields,
        current_values: currentValues,
      },
      steps: [
        {
          step_name: 'Admin Approval',
          approver: adminUser._id,
          status: 'Pending',
        },
      ],
    });
  
    await changeRequest.save();
  
    const adminUsers = await User.find({ role: UserRole.Admin, status: 'Active' }).exec();
    const adminEmails = adminUsers.map((admin) => admin.email).filter(Boolean);
  
    if (adminEmails.length > 0) {
      await sendEmailChangeMail({
        to: adminEmails.join(','),
        subject: 'New User Profile Change Request',
        text: `User ${user.name} (${user.email}) has submitted a profile change request.`,
        html: `<p>User <strong>${user.name}</strong> (${user.email}) has submitted a profile change request.</p>`,
      });
    }
  
    return transformChangeRequest(changeRequest.toObject());
  };
  

/**
 * Service to fetch all pending change requests (Admin only)
 */
export const getAllPendingChangeRequestsService = async (
    includeDeleted = false
  ): Promise<IChangeRequestApproval[]> => {
    const query: Record<string, any> = { status: 'Pending' };
    if (!includeDeleted) {
      query.isDeleted = { $ne: true }; // Exclude deleted requests by default
    }
  
    const changeRequests = await ChangeRequestApproval.find(query)
      .populate('user', 'name email')
      .populate('steps.approver', 'name email')
      .lean()
      .exec();
  
    const transformedChangeRequests: IChangeRequestApproval[] = changeRequests.map(transformChangeRequest);
  
    return transformedChangeRequests;
  };
  

/**
 * Service to approve a change request
 */
/**
 * Service to approve a change request
 */
function removeMongoInternalProps(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(removeMongoInternalProps);
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const key of Object.keys(obj)) {
        if (!key.startsWith('$') && !key.startsWith('_')) {
          newObj[key] = removeMongoInternalProps(obj[key]);
        }
      }
      return newObj;
    } else {
      return obj;
    }
  }
  
  const sanitizeChanges = (changes: Record<string, { old: any; new: any }>) => {
    const sanitized: Record<string, { old: any; new: any }> = {};
    for (const [key, value] of Object.entries(changes)) {
      sanitized[key] = {
        old: removeMongoInternalProps(value.old),
        new: removeMongoInternalProps(value.new),
      };
    }
    return sanitized;
  };
  
  export const approveChangeRequestService = async (
    changeRequestId: string,
    adminId: mongoose.Types.ObjectId,
    comments?: string
  ): Promise<string> => {
    if (!mongoose.Types.ObjectId.isValid(changeRequestId)) {
      throw new Error('Invalid Change Request ID.');
    }
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const changeRequest = await ChangeRequestApproval.findById(changeRequestId)
        .populate('user')
        .session(session)
        .exec();
  
      if (!changeRequest) {
        throw new Error('Change request not found.');
      }
  
      if (changeRequest.status !== 'Pending') {
        throw new Error(`Change request is already ${changeRequest.status}.`);
      }
  
      const user = await User.findById(changeRequest.user._id).session(session).exec();
      if (!user) {
        throw new Error('User not found.');
      }
  
      // Convert Maps to plain objects
      const fieldsToChange =
        changeRequest.request_data.fields_to_change instanceof Map
          ? Object.fromEntries(changeRequest.request_data.fields_to_change)
          : changeRequest.request_data.fields_to_change;
  
      const currentValues =
        changeRequest.request_data.current_values instanceof Map
          ? Object.fromEntries(changeRequest.request_data.current_values)
          : changeRequest.request_data.current_values;
  
      // Check for unique email before applying changes
      if (fieldsToChange.email) {
        const existingUser = await User.findOne({ email: fieldsToChange.email })
          .session(session)
          .exec();
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          throw new Error('Email address already in use by another user.');
        }
      }
  
      // Apply changes to the user's profile
      for (const [field, value] of Object.entries(fieldsToChange)) {
        if (field === 'address' && typeof value === 'object') {
          user.address = { ...(user.address || {}), ...(value as IAddress) };
        } else {
          (user as any)[field] = value;
        }
      }
      await user.save({ session });
  
      // Update the change request status and history
      changeRequest.status = 'Approved';
      changeRequest.history.push({
        step_name: 'Admin Approval',
        status: 'Approved',
        decision_date: new Date(),
        approver: adminId,
        comments,
      });
  
      const currentStep = changeRequest.steps.find((step) => step.status === 'Pending');
      if (currentStep) {
        currentStep.status = 'Approved';
        currentStep.decision_date = new Date();
        currentStep.comments = comments;
      }
      await changeRequest.save({ session });
  
      // Prepare changes object for the audit log
      const changes: Record<string, { old: any; new: any }> = {};
      for (const [field, newValue] of Object.entries(fieldsToChange)) {
        const oldValue = currentValues[field];
        changes[field] = { old: oldValue, new: newValue };
      }
  
      // Sanitize the changes
      const sanitizedChanges = sanitizeChanges(changes);
  
      // Log the changes in AuditLog
      const auditLog = new AuditLog({
        user: user._id,
        changed_by: adminId,
        changes: sanitizedChanges,
      });
  
      await auditLog.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
      // Notify user
      await sendEmailChangeMail({
        to: user.email,
        subject: 'Your Profile Change Request has been Approved',
        text: `Hello ${user.name},\n\nYour profile change request has been approved and your profile has been updated.\n\nComments: ${comments}\n\nRegards,\nAdmin Team`,
        html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your profile change request has been approved and your profile has been updated.</p><p>Comments: ${comments}</p><p>Regards,<br/>Admin Team</p>`,
      });
  
      return 'Change request approved and profile updated successfully.';
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  };
  
/**
 * Service to reject a change request
 */
export const rejectChangeRequestService = async (
    changeRequestId: string,
    adminId: mongoose.Types.ObjectId,
    comments?: string
  ): Promise<string> => {
    if (!mongoose.Types.ObjectId.isValid(changeRequestId)) {
      throw new Error('Invalid Change Request ID.');
    }
  
    const changeRequest = await ChangeRequestApproval.findById(changeRequestId).populate('user').exec();
  
    if (!changeRequest) {
      throw new Error('Change request not found.');
    }
  
    if (changeRequest.status !== 'Pending') {
      throw new Error(`Change request is already ${changeRequest.status}.`);
    }
  
    // Update the change request
    changeRequest.status = 'Rejected';
    changeRequest.history.push({
      step_name: 'Admin Approval',
      status: 'Rejected',
      decision_date: new Date(),
      approver: adminId,
      comments, // Store comments here
    });
  
    const currentStep = changeRequest.steps.find((step) => step.status === 'Pending');
    if (currentStep) {
      currentStep.status = 'Rejected';
      currentStep.decision_date = new Date();
      currentStep.comments = comments; // Store comments in step
    }
  
    await changeRequest.save();
  
    // Notify the user via email
    const user = await User.findById(changeRequest.user._id).exec();
    if (user) {
      await sendEmailChangeMail({
        to: user.email,
        subject: 'Your Profile Change Request has been Rejected',
        text: `Hello ${user.name},\n\nYour profile change request has been rejected.\n\nComments: ${comments}\n\nRegards,\nAdmin Team`,
        html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your profile change request has been rejected.</p><p>Comments: ${comments}</p><p>Regards,<br/>Admin Team</p>`,
      });
    }

    // Log the rejection in AuditLog
    const auditLog = new AuditLog({
        user: changeRequest.user._id,
        changed_by: adminId,
        changes: {
        status: { old: 'Pending', new: 'Rejected' },
        comments: { old: null, new: comments },
        },
    });
  await auditLog.save();
  
    return 'Change request rejected successfully.';
  };
  
/**
 * Service to delete a change request (Admin only)
 */
export const deleteChangeRequestService = async (
  changeRequestId: string
): Promise<string> => {
  if (!mongoose.Types.ObjectId.isValid(changeRequestId)) {
    throw new Error('Invalid Change Request ID.');
  }

  const changeRequest = await ChangeRequestApproval.findById(changeRequestId).exec();

  if (!changeRequest) {
    throw new Error('Change request not found.');
  }

  if (changeRequest.status !== 'Pending') {
    throw new Error(`Cannot delete a ${changeRequest.status} change request.`);
  }

  await ChangeRequestApproval.findByIdAndDelete(changeRequestId).exec();

  return 'Change request deleted successfully.';
};

/**
 * Service to fetch change requests for a user
 */
export const getUserChangeRequestsService = async (userId: string, includeDeleted = false) => {
    if (!userId) throw new Error('User ID is required.');
  
    try {
      const query: Record<string, any> = { user: userId };
      if (!includeDeleted) {
        query.isDeleted = { $ne: true }; // Exclude deleted requests
      }
  
      const changeRequests = await ChangeRequestApproval.find(query).lean();
      return changeRequests;
    } catch (error: any) {
      console.error('Error fetching user change requests:', error);
      throw new Error('Failed to fetch change requests.');
    }
  };
  


  export const softDeleteChangeRequestService = async (
    userId: string,
    requestId: string,
    reason: string
  ) => {
    const changeRequest = await ChangeRequestApproval.findById(requestId);
  
    if (!changeRequest) {
      throw new Error('Change request not found.');
    }
  
    // Ensure the request belongs to the user and is in "Pending" status
    if (changeRequest.user.toString() !== userId || changeRequest.status !== 'Pending') {
      throw new Error('You can only delete your own pending change requests.');
    }
  
    // Convert userId (string) to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
  
    // Soft delete the request
    changeRequest.isDeleted = true;
    changeRequest.deletedReason = reason;
    changeRequest.deletedBy = userObjectId; // Use ObjectId instead of string
    changeRequest.deletedAt = new Date();
  
    await changeRequest.save();
  
    return changeRequest;
  };

  export const getSoftDeletedChangeRequestsService = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;
  
    const softDeletedRequests = await ChangeRequestApproval.find({ isDeleted: true })
      .populate('user', 'name email')
      .skip(skip)
      .limit(limit)
      .lean();
  
    const totalCount = await ChangeRequestApproval.countDocuments({ isDeleted: true });
  
    return { data: softDeletedRequests, totalCount };
  };
  
  

  export const permanentlyDeleteChangeRequestService = async (requestId: string) => {
    const changeRequest = await ChangeRequestApproval.findById(requestId);
  
    if (!changeRequest) {
      throw new Error('Change request not found.');
    }
  
    if (!changeRequest.isDeleted) {
      throw new Error('This request is not marked as deleted.');
    }
  
    await ChangeRequestApproval.findByIdAndDelete(requestId);
  
    return { message: 'Change request permanently deleted.' };
  };


  export const restoreChangeRequestService = async (requestId: string) => {
    const changeRequest = await ChangeRequestApproval.findById(requestId)
      .populate('user', '_id') // Ensure only `_id` is populated
      .populate('deletedBy', '_id') // Ensure only `_id` is populated
      .exec();
  
    if (!changeRequest) {
      throw new Error('Change request not found.');
    }
  
    if (!changeRequest.isDeleted) {
      throw new Error('This request is not marked as deleted.');
    }
  
    // Safely handle `deletedBy` and `user` fields
    const userId =
      changeRequest.user instanceof mongoose.Types.ObjectId
        ? changeRequest.user
        : (changeRequest.user as { _id: mongoose.Types.ObjectId })._id;
  
    const deletedById =
      changeRequest.deletedBy instanceof mongoose.Types.ObjectId
        ? changeRequest.deletedBy
        : (changeRequest.deletedBy as { _id: mongoose.Types.ObjectId } | undefined)?._id;
  
    if (!userId) {
      throw new Error('Invalid user associated with the change request.');
    }
  
    // Prepare the old state for audit logging
    const oldState = {
      isDeleted: true,
      deletedReason: changeRequest.deletedReason,
    };
  
    // Restore the change request
    changeRequest.isDeleted = false;
    changeRequest.deletedReason = undefined;
    changeRequest.deletedBy = undefined;
    changeRequest.deletedAt = undefined;
  
    await changeRequest.save();
  
    // Log the restoration in AuditLog
    await createAuditLog(userId, deletedById ?? userId, {
      isDeleted: { old: oldState.isDeleted, new: false },
      deletedReason: { old: oldState.deletedReason, new: undefined },
    });
  
    return { message: 'Change request restored successfully.' };
};