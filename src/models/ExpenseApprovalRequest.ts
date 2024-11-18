// src/models/ExpenseApprovalRequest.ts

import mongoose, { Schema, Model } from 'mongoose';
import ApprovalRequestBase, { IApprovalRequestBase } from './ApprovalRequest';

export interface IExpenseApprovalRequest extends IApprovalRequestBase {
  request_data: {
    amount: number;
    currency: string;
    receipt: string; // URL or file path
    expense_category: string;
  };
}

const ExpenseApprovalRequestSchema: Schema<IExpenseApprovalRequest> = new Schema({
  request_data: {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    receipt: { type: String, required: true },
    expense_category: { type: String, required: true },
  },
});

// Create the Discriminator
const ExpenseApprovalRequest: Model<IExpenseApprovalRequest> = ApprovalRequestBase.discriminator<IExpenseApprovalRequest>('Expense', ExpenseApprovalRequestSchema);

export default ExpenseApprovalRequest;
