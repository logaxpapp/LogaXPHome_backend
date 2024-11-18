// src/models/OtherApprovalRequest.ts

import mongoose, { Schema, Model } from 'mongoose';
import ApprovalRequestBase, { IApprovalRequestBase } from  './ApprovalRequest';

export interface IOtherApprovalRequest extends IApprovalRequestBase {
  request_data: {
    details: string;
    // Add other specific fields as needed
  };
}

const OtherApprovalRequestSchema: Schema<IOtherApprovalRequest> = new Schema({
  request_data: {
    details: { type: String, required: true },
    // Add other specific fields here
  },
});

// Create the Discriminator
const OtherApprovalRequest: Model<IOtherApprovalRequest> = ApprovalRequestBase.discriminator<IOtherApprovalRequest>('Other', OtherApprovalRequestSchema);

export default OtherApprovalRequest;
