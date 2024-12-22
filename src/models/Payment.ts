import mongoose, { Schema, Document } from 'mongoose';

// src/models/Payment.ts (or wherever your IPayment is defined)
export interface IPayment extends Document {
    contract: mongoose.Types.ObjectId; // Reference to Contract
    contractor: mongoose.Types.ObjectId; // Reference to User (role: contractor)
    amount: number; // Payment amount
    date: Date; // Payment date
    // Extend your status union to include new strings
    status:
      | 'Pending'
      | 'Confirmed'
      | 'Declined'
      | 'AcceptedByContractor'
      | 'DeclinedByContractor';
    acknowledgment: boolean; // Whether contractor acknowledges the payment
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  const PaymentSchema = new Schema<IPayment>(
    {
      contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
      contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: [
          'Pending',
          'Confirmed',
          'Declined',
          'AcceptedByContractor',
          'DeclinedByContractor',
        ],
        default: 'Pending',
      },
      acknowledgment: { type: Boolean, default: false },
      notes: { type: String, default: '' },
    },
    { timestamps: true }
  );
  
  export default mongoose.model<IPayment>('Payment', PaymentSchema);
  