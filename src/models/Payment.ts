import mongoose, { Schema, Document, HydratedDocument } from 'mongoose';

export interface IPayment extends Document {
  contract: mongoose.Types.ObjectId;
  contractor: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  exchangeRate?: number;
  date: Date;
  status:
    | 'Pending'
    | 'Confirmed'
    | 'Declined'
    | 'AcceptedByContractor'
    | 'DeclinedByContractor'
    | 'AwaitingAcknowledgment'
    | 'AwaitingConfirmation';

  acknowledgment: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'NGN', 'JPY', 'CNY'],
      default: 'USD',
      required: true,
    },
    exchangeRate: Number,
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Declined',
        'AcceptedByContractor',
        'DeclinedByContractor',
        'AwaitingAcknowledgment',
        'AwaitingConfirmation',
      ],
      default: 'Pending',
    },
    acknowledgment: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// In Mongoose 7+, you can define Payment as:
const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
