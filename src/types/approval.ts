// src/types/approval.ts

import mongoose from 'mongoose';
import { IUser } from '../models/User';

export type ApprovalRequestType = 'Leave' | 'Expense' | 'Appraisal' | 'Other';

export interface IApprovalStep {
  step_name: string;
  approver: mongoose.Types.ObjectId | IUser;
  status: 'Pending' | 'Approved' | 'Rejected';
  decision_date?: Date;
  comments?: string;
}

export interface IApprovalHistory {
  step_name: string;
  status: 'Approved' | 'Rejected';
  decision_date: Date;
  approver: mongoose.Types.ObjectId | IUser;
  comments?: string;
}

// Base Interface without Populated Fields
export interface IApprovalRequestBase<T = any> extends mongoose.Document {
  user: mongoose.Types.ObjectId | IUser;
  request_type: ApprovalRequestType;
  request_details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  current_step: number;
  request_data: T; 
  steps: IApprovalStep[];
  history: IApprovalHistory[];
  comments?: string; // Ensure this is included
  created_at: Date;
  updated_at: Date;
}

// Populated Interface with IUser
export interface IApprovalRequestPopulated extends IApprovalRequestBase {
  user: IUser; // Populated IUser
  steps: Array<IApprovalStep & { approver: IUser }>; // Populated IUser in steps
  history: Array<{
    step_name: string;
    status: 'Approved' | 'Rejected';
    decision_date: Date;
    approver: IUser; // Populated IUser in history
    comments?: string;
  }>;
}

// Response Interface
export interface IGetUserApprovalRequestsResponse {
  data: IApprovalRequestPopulated[];
  total: number;
  page: number;
  pages: number;
}

export interface IProcessApprovalPayload {
  requestId: string;
  action: 'finalize' | 'add_step';
  status: 'Approved' | 'Rejected';
  comments?: string;
  newApproverId?: string;
  stepName?: string;
}
