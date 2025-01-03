import mongoose, { Schema, Document } from 'mongoose';

/** 
 * Define the shape of each risk item in the riskSection array.
 */
export interface IRisk {
  riskName: string;                    // e.g., "Security Breach"
  description?: string;               // e.g., "Possible data exposure"
  severity?: 'Low' | 'Medium' | 'High';
  probability?: number;               // 0 to 1
  impact?: 'Low' | 'Medium' | 'High';
  mitigationStrategy?: string;
}

/**
 * Main Contract interface
 */
export interface IContract extends Document {
  companyName: string; // REQUIRED field
  contractor: mongoose.Types.ObjectId; // Link to User (Contractor)
  admin: mongoose.Types.ObjectId;      // Link to User (Admin)

  projectName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  paymentTerms: string; // e.g., 'Hourly', 'Fixed', etc.
  totalCost: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'NGN';
  status: 'Draft' | 'Pending' | 'Active' | 'Completed' | 'Terminated';

  contractorResponse: {
    response: 'Accepted' | 'Declined' | 'Pending';
    notes: string;
  };
  deliverables: string[];
  attachments?: string[];
  
  // NEW robust risk array
  riskSection?: IRisk[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sub-schema for each Risk item
 */
const RiskSchema = new Schema<IRisk>(
  {
    riskName: { type: String, required: true },
    description: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    probability: {
      type: Number,
      min: 0,
      max: 1,
    },
    impact: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    mitigationStrategy: { type: String, default: '' },
  },
  { _id: false } // Do not create separate _id for each subdoc
);

/**
 * Main Contract schema
 */
const ContractSchema = new Schema<IContract>(
  {
    companyName: { type: String, required: true }, // NEW REQUIRED FIELD

    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    projectName: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentTerms: { type: String, required: true },
    totalCost: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'NGN'], default: 'USD' },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Active', 'Completed', 'Terminated'],
      default: 'Draft',
    },

    contractorResponse: {
      response: {
        type: String,
        enum: ['Accepted', 'Declined', 'Pending'],
        default: 'Pending',
      },
      notes: { type: String, default: '' },
    },
    deliverables: [{ type: String }],
    attachments: [{ type: String }],

    // NEW robust risk array
    riskSection: {
      type: [RiskSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Optional text index for searching
ContractSchema.index({ companyName: 'text', projectName: 'text' });

export default mongoose.model<IContract>('Contract', ContractSchema);
