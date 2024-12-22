import mongoose, { Schema, Document } from 'mongoose';

export interface IContract extends Document {
  contractor: mongoose.Types.ObjectId; // Reference to User (Contractor)
  admin: mongoose.Types.ObjectId; // Reference to User (Admin)
  projectName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  paymentTerms: string; // e.g., Hourly, Fixed, Milestone-based
  totalCost: number;
  status: 'Draft' | 'Pending' | 'Active' | 'Completed' | 'Terminated';
  contractorResponse: {
    response: 'Accepted' | 'Declined' | 'Pending';
    notes: string;
  };
  deliverables: string[]; // List of deliverables
  attachments?: string[]; // File links
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Link to Contractor
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Link to Admin
    projectName: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentTerms: { type: String, required: true },
    totalCost: { type: Number, required: true },
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
      notes: { type: String, default: '' }, // Reason for declining (if applicable)
    },
    deliverables: [{ type: String }],
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IContract>('Contract', ContractSchema);
