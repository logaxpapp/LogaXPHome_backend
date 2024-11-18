import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';
import { IPayPeriod } from './PayPeriod';

export interface IPayPeriodEmployee extends Document {
  payPeriod: mongoose.Types.ObjectId | IPayPeriod;
  employee: mongoose.Types.ObjectId | IUser;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalPay: number;
  regularPay: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  createdAt: Date;
  updatedAt: Date;
}

const PayPeriodEmployeeSchema: Schema<IPayPeriodEmployee> = new Schema(
  {
    payPeriod: { type: Schema.Types.ObjectId, ref: 'PayPeriod', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalHours: { type: Number, default: 0 },
    regularHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    totalPay: { type: Number, default: 0 },
    regularPay: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 }, // Taxes, benefits, etc.
    netPay: { type: Number, default: 0 }, // Gross pay minus deductions
  },
  { timestamps: true }
);


const PayPeriodEmployee: Model<IPayPeriodEmployee> = mongoose.model<IPayPeriodEmployee>('PayPeriodEmployee', PayPeriodEmployeeSchema);
export default PayPeriodEmployee;
