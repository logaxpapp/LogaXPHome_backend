// src/models/LeaveApprovalRequest.ts

import mongoose, { Schema, Model } from 'mongoose';
import ApprovalRequestBase, { IApprovalRequestBase, ApprovalRequestType } from  './ApprovalRequest';

export interface ILeaveApprovalRequest extends IApprovalRequestBase {
  request_data: {
    leave_type: string;
    start_date: Date;
    end_date: Date;
    reason: string;
  };
}

const LeaveApprovalRequestSchema: Schema<ILeaveApprovalRequest> = new Schema({
  request_data: {
    leave_type: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reason: { type: String, required: true },
  },
});

// Create the Discriminator
const LeaveApprovalRequest: Model<ILeaveApprovalRequest> = ApprovalRequestBase.discriminator<ILeaveApprovalRequest>('Leave', LeaveApprovalRequestSchema);

export default LeaveApprovalRequest;
