// src/types/changeRequest.ts
// src/types/changeRequest.ts

import { IUser } from '../models/User';
import mongoose from 'mongoose';
import { IApprovalHistory } from '../models/ApprovalRequest';

export type ChangeRequestAllowedFields =
  | 'name'
  | 'email'
  | 'phone_number'
  | 'address'
  | 'profile_picture_url'
  | 'date_of_birth'
  | 'employment_type'
  | 'hourlyRate'
  | 'overtimeRate'
  | 'job_title'
  | 'department';

export interface IChangeRequestApproval {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  request_type: 'ChangeRequest';
  request_details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  current_step: number;
  request_data: {
    fields_to_change: Partial<IUser>;
    current_values: Partial<IUser>;
  };
  steps: Array<{
    step_name: string;
    approver: {
      _id: string;
      name: string;
      email: string;
    };
    status: 'Pending' | 'Approved' | 'Rejected';
    decision_date?: Date; // Changed from string to Date
    comments?: string;
  }>;
  history: IApprovalHistory[]; // Use the imported IApprovalHistory interface
  created_at: Date; // Changed from string to Date
  updated_at: Date; // Changed from string to Date
}

export interface ICreateChangeRequestPayload {
  fields_to_change: Partial<IUser>;
}

export interface IProcessChangeRequestPayload {
  comments?: string;
}
