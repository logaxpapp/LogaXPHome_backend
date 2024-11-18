// src/models/ApprovalRequestBase.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

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

export interface IApprovalRequestBase<T = any> extends Document {
  user: mongoose.Types.ObjectId | IUser;
  request_type: ApprovalRequestType;
  request_details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  current_step: number;
  request_data: T; 
  steps: IApprovalStep[];
  history: IApprovalHistory[];
  created_at: Date;
  updated_at: Date;
}



export interface IApprovalRequestBasePopulated extends IApprovalRequestBase {
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


const ApprovalRequestBaseSchema: Schema<IApprovalRequestBase> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    request_type: { 
      type: String, 
      enum: ['Leave', 'Expense', 'Appraisal', 'Other'], 
      required: true 
    },
    request_details: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected'], 
      default: 'Pending' 
    },
    current_step: { type: Number, default: 0 },
    steps: [
      {
        step_name: { type: String, required: true },
        approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        decision_date: { type: Date },
        comments: { type: String },
      },
    ],
    history: [
      {
        step_name: { type: String, required: true },
        status: { type: String, enum: ['Approved', 'Rejected'], required: true },
        decision_date: { type: Date, required: true },
        approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        comments: { type: String },
      },
    ],
  },
  { 
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    discriminatorKey: 'request_type', 
    collection: 'approvalrequests'
  }
);

ApprovalRequestBaseSchema.index({ status: 1, current_step: 1 });

const ApprovalRequestBase: Model<IApprovalRequestBase> = mongoose.model<IApprovalRequestBase>('ApprovalRequestBase', ApprovalRequestBaseSchema);
export default ApprovalRequestBase;
