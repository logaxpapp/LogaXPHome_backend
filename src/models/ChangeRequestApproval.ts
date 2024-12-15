import mongoose, { Schema, Model } from 'mongoose';
import ApprovalRequestBase, { IApprovalRequestBase } from './ApprovalRequest';
import { IUser } from './User';

export interface IChangeRequestApproval extends IApprovalRequestBase {
  request_data: {
    fields_to_change: Partial<IUser>; // Fields the user wants to change
    current_values: Partial<IUser>; // Current values of the fields
  };
  isDeleted: boolean; // Soft deletion flag
  deletedReason?: string; // Reason for soft deletion
  deletedBy?: mongoose.Types.ObjectId; // User who deleted the request
  deletedAt?: Date; // Timestamp of soft deletion
}


const ChangeRequestApprovalSchema: Schema<IChangeRequestApproval> = new Schema({
  request_data: {
    fields_to_change: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
    },
    current_values: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
    },
    history: [
        {
          step_name: { type: String, required: true },
          status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], required: true },
          decision_date: { type: Date },
          approver: { type: mongoose.Types.ObjectId, ref: 'User' },
          comments: { type: String },
        },
      ],
      
  },
  isDeleted: { type: Boolean, default: false },
  deletedReason: { type: String },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
});

const ChangeRequestApproval: Model<IChangeRequestApproval> = ApprovalRequestBase.discriminator<IChangeRequestApproval>(
  'ChangeRequest',
  ChangeRequestApprovalSchema
);

export default ChangeRequestApproval;
