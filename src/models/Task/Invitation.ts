// src/models/Task/Invitation.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IBoard } from './Board';
import { IUser } from '../User';
import { UserRole } from '../../types/enums';

export interface IInvitation extends Document {
  board: mongoose.Types.ObjectId | IBoard;
  invitedEmail: string;                  // Email of the invitee
  invitedBy: mongoose.Types.ObjectId | IUser;
  role: UserRole;                        // e.g. subContractor, user, ...
  status: 'pending' | 'accepted' | 'declined';
  inviteToken: string;                   // Random token for verifying
  declineReason?: string;                // Optional reason for declining
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    invitedEmail: {
      type: String,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    inviteToken: {
      type: String,
      required: true,
    },
    declineReason: {
      type: String,
      trim: true,
      default: undefined, // Not required, only set if the invitation is declined
    },
  },
  { timestamps: true }
);

export default mongoose.model<IInvitation>('Invitation', InvitationSchema);
