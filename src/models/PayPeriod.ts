import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';
import { IShift } from './Shift';

export enum PayPeriodStatus {
  Open = 'Open',
  Closed = 'Closed',
  Processed = 'Processed',
}

export interface IPayPeriod extends Document {
  startDate: Date;
  endDate: Date;
  status: PayPeriodStatus;
  createdBy: mongoose.Types.ObjectId | IUser;
  shifts: mongoose.Types.ObjectId[] | IShift[]; // Optional if shifts are dynamically fetched
  createdAt: Date;
  updatedAt: Date;
}

const PayPeriodSchema: Schema<IPayPeriod> = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(PayPeriodStatus),
      default: PayPeriodStatus.Open,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shifts: [{ type: Schema.Types.ObjectId, ref: 'Shift' }],
  },
  { timestamps: true }
);

PayPeriodSchema.index({ startDate: 1, endDate: 1 });
PayPeriodSchema.index({ status: 1 });

const PayPeriod: Model<IPayPeriod> = mongoose.model<IPayPeriod>('PayPeriod', PayPeriodSchema);
export default PayPeriod;
