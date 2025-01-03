// src/services/paymentService.ts

import Payment, { IPayment } from '../models/Payment';
import { Types } from 'mongoose';
import { HydratedDocument } from 'mongoose';
import {
  fetchExchangeRates,
  convertCurrency,
} from './currencyService';



// 1) Build a narrower type for editable fields
type EditablePaymentFields = Pick<IPayment, 'amount' | 'currency' | 'notes'>;
type EditablePaymentUpdate = Partial<EditablePaymentFields>;
/**
 * Create a payment record (usually by an Admin).
 * Includes handling currency and exchange rates.
 */
export const createPayment = async (data: Omit<IPayment, 'createdAt' | 'updatedAt'>) => {
  // Optionally, convert amount to base currency (e.g., USD)
  const baseCurrency = 'USD'; // Define your base currency
  let exchangeRate: number | undefined = undefined;

  if (data.currency !== baseCurrency) {
    try {
      // Fetch exchange rate from the specified currency to base currency
      const rates = await fetchExchangeRates(data.currency);
      exchangeRate = rates[baseCurrency];
      if (!exchangeRate) {
        throw new Error(`Exchange rate not found for ${baseCurrency}`);
      }
      // Optionally, you can store amount in base currency as well
      // data.amountBase = data.amount * exchangeRate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw error;
    }
  }

  const payment = new Payment({
    ...data,
    exchangeRate,
  });

  return await payment.save();
};

/**
 * Get all payments for a specific contract.
 */
export const getPaymentsByContract = async (contractId: string) => {
  return await Payment.find({ contract: contractId })
    .populate('contract contractor');
};

/**
 * Confirm a payment (e.g., Admin verifying the payment is valid).
 */
export const confirmPayment = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  payment.status = 'Confirmed';
  await payment.save();
  return payment;
};

/**
 * Decline a payment (e.g., Admin or system finds payment invalid).
 */
export const declinePayment = async (paymentId: string, notes: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  payment.status = 'Declined';
  payment.notes = notes || '';
  await payment.save();
  return payment;
};

/**
 * Contractor acknowledges they have received/seen the payment.
 */
export const acknowledgePayment = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (payment.status === 'AwaitingAcknowledgment') {
    payment.status = 'AcceptedByContractor'; // Transition to next status
  }
  payment.acknowledgment = true; // Mark payment as acknowledged
  await payment.save();

  return payment;
};


/**
 * Compute total paid to date for a given contract.
 * Only "Confirmed" payments count toward the total paid.
 */
export const getTotalPaidForContract = async (contractId: string) => {
  const payments = await Payment.find({
    contract: contractId,
    status: 'Confirmed',
  });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return totalPaid;
};

/**
 * Contractor accepts the payment (NEW).
 */
export const acceptPaymentByContractor = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  // Update status based on business logic
  payment.status = 'AcceptedByContractor'; // or 'Confirmed'
  await payment.save();
  return payment;
};

/**
 * Contractor declines the payment (NEW).
 */
export const declinePaymentByContractor = async (paymentId: string, reason?: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  payment.status = 'DeclinedByContractor'; // or 'Declined'
  if (reason) {
    payment.notes = reason;
  }
  await payment.save();
  return payment;
};

/**
 * Send a payment (Admin action) to set status to 'AwaitingAcknowledgment'.
 */
export const sendPayment = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (payment.status !== 'Pending') {
    throw new Error('Only pending payments can be sent');
  }

  payment.status = 'AwaitingAcknowledgment';
  await payment.save();
  return payment;
};

/**
 * Delete a payment.
 */
export const deletePayment = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  await Payment.findByIdAndDelete(paymentId);
  return { message: 'Payment deleted successfully' };
};

export const editPayment = async (
  paymentId: string,
  updateData: Partial<EditablePaymentFields>
): Promise<HydratedDocument<IPayment>> => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  if (payment.status === 'Confirmed') {
    throw new Error('Cannot edit a confirmed payment');
  }

  // Use a single cast to `any` (or to a typed dictionary):
  const doc = payment as any; // or as unknown as Record<string, unknown>

  for (const key of ['amount', 'currency', 'notes'] as const) {
    if (updateData[key] !== undefined) {
      doc[key] = updateData[key];
    }
  }

  await payment.save();
  return payment;
};