import Payment, { IPayment } from '../models/Payment';
import { Types } from 'mongoose';

/**
 * Create a payment record (usually by an Admin).
 */
export const createPayment = async (data: Omit<IPayment, 'createdAt' | 'updatedAt'>) => {
  const payment = new Payment(data);
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
 * Contractor acknowledges they have received / seen the payment.
 */
export const acknowledgePayment = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  
  payment.acknowledgment = true;
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

export const acceptPaymentByContractor = async (paymentId: string) => {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
  
    // For example, mark the payment status as "Confirmed" or "AcceptedByContractor"
    payment.status = 'AcceptedByContractor'; // or 'Confirmed' if that suits your business rules
    await payment.save();
    return payment;
  };
  
  export const declinePaymentByContractor = async (paymentId: string, reason?: string) => {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
  
    payment.status = 'DeclinedByContractor'; // or just 'Declined' if that's acceptable
    if (reason) {
      payment.notes = reason;
    }
    await payment.save();
    return payment;
  };
