import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IUser } from './User';
import { IReferee } from './Referee';

// Reference Status Enum
export enum ReferenceStatus {
  Pending = 'Pending',
  Sent = 'Sent',
  Received = 'Received',
  Completed = 'Completed',
  Rejected = 'Rejected',
}

/**
 * The Reference model stores what the referee actually submits, plus
 * any additional fields or references (e.g., salary, performance).
 * It also has the referee’s signature for authenticity.
 */
export interface IReference extends Document {
  _id: Types.ObjectId;
  applicant: Types.ObjectId | IUser;   // The user (applicant) requesting this reference
  referee: Types.ObjectId | IReferee;  // The Referee document

  // Common fields
  relationship?: string;
  positionHeld?: string;
  startDate?: Date;
  endDate?: Date;
  daysAbsent?: string;
  periodsAbsent?: string;
  reasonForLeaving?: string;
  salary?: string;
  performance?: string;
  conduct?: string;
  integrity?: string;
  additionalComments?: string;

  // Include name, address, and now companyName
  name?: string;         // Referee’s name (entered in the form)
  address?: string;      // Referee’s address (entered in the form)
  companyName?: string;  // Referee’s company name (entered in the form)

  // "Would you re-employ them?"
  reEmploy: {
    type: String,
    enum: ['Yes', 'No', 'Maybe'],
    default: '',
    trim: true,
  };

  // The referee’s signature (base64 data URL or typed)
  refereeSignature?: string;

  // Lifecycle & status
  status: ReferenceStatus;
  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  attachments?: string[];
  sentAt?: Date;
  receivedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;

  // Token-based link for the referee to fill the form
  token: string;
  tokenExpiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Reference Schema
const ReferenceSchema: Schema<IReference> = new Schema<IReference>(
  {
    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referee: {
      type: Schema.Types.ObjectId,
      ref: 'Referee',
      required: true,
    },

    // Loosened constraints: optional fields
    relationship: { type: String, trim: true },
    positionHeld: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    reasonForLeaving: { type: String, trim: true },
    salary: { type: String, trim: true },
    performance: { type: String, trim: true },
    conduct: { type: String, trim: true },
    integrity: { type: String, trim: true },
    additionalComments: { type: String, trim: true },
    daysAbsent: { type: String, trim: true },
    periodsAbsent: { type: String, trim: true },

    // Fields for name, address, and companyName
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    companyName: { type: String, trim: true },

    // Re-employment field
    reEmploy: {
      type: String,
      enum: ['', 'Yes', 'No', 'Maybe'],
      default: '',
      trim: true,
    },

    // Signature
    refereeSignature: { type: String, trim: true },

    // Lifecycle & status
    status: {
      type: String,
      enum: Object.values(ReferenceStatus),
      default: ReferenceStatus.Pending,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [{ type: String }],

    sentAt: { type: Date },
    receivedAt: { type: Date },
    completedAt: { type: Date },
    rejectionReason: { type: String, trim: true },

    // Token-based link for the referee
    token: {
      type: String,
      required: true,
      unique: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Reference: Model<IReference> = mongoose.model<IReference>('Reference', ReferenceSchema);
export default Reference;
