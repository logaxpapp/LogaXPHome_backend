// src/controllers/paymentController.ts

import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import Contract from '../models/Contract';
import Payment from '../models/Payment';

/**
 * Create a payment record (Admin only).
 */
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { contract, contractor, amount, currency } = req.body;

    // Basic validation
    if (!contract || !contractor || !amount || !currency) {
      res.status(400).json({ message: 'Missing required payment fields' });
      return;
    }

    // Optional: Validate currency
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'JPY', 'CNY']; // Expand as needed
    if (!supportedCurrencies.includes(currency)) {
      res.status(400).json({ message: 'Unsupported currency' });
      return;
    }

    const payment = await paymentService.createPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Failed to create payment', error });
  }
};

/**
 * Retrieve all payments for a given contract.
 */
export const getPaymentsForContract = async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const payments = await paymentService.getPaymentsByContract(contractId);
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments', error });
  }
};

/**
 * Confirm a payment (Admin verifying correctness).
 */
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const updatedPayment = await paymentService.confirmPayment(paymentId);
    res.status(200).json({
      message: 'Payment confirmed successfully.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment', error });
  }
};

/**
 * Decline a payment (with optional notes).
 */
export const declinePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { notes } = req.body;
    const updatedPayment = await paymentService.declinePayment(paymentId, notes);
    res.status(200).json({
      message: 'Payment declined successfully.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error declining payment:', error);
    res.status(500).json({ message: 'Failed to decline payment', error });
  }
};

/**
 * Contractor acknowledges the payment.
 */
export const acknowledgePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const updatedPayment = await paymentService.acknowledgePayment(paymentId);
    res.status(200).json({
      message: 'Payment acknowledged by contractor.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error acknowledging payment:', error);
    res.status(500).json({ message: 'Failed to acknowledge payment', error });
  }
};

/**
 * Get total paid vs. total cost for a contract (Balance).
 */
export const getContractPaymentSummary = async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const contract = await Contract.findById(contractId);
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    const totalPaid = await paymentService.getTotalPaidForContract(contractId);
    const balance = contract.totalCost - totalPaid;

    res.status(200).json({
      totalCost: contract.totalCost,
      totalPaid,
      balance,
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ message: 'Failed to fetch payment summary', error });
  }
};

/**
 * Contractor accepts the payment (NEW).
 */
export const acceptPaymentByContractor = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    // Optional: Verify that the authenticated user is the contractor associated with this payment
    // const userId = req.user.id;
    // const payment = await Payment.findById(paymentId);
    // if (!payment || payment.contractor.toString() !== userId) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }

    const updatedPayment = await paymentService.acceptPaymentByContractor(paymentId);
    res.status(200).json({
      message: 'Payment accepted by contractor.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error accepting payment (contractor):', error);
    res.status(500).json({ message: 'Failed to accept payment by contractor', error });
  }
};

/**
 * Contractor declines the payment (NEW).
 */
export const declinePaymentByContractor = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    // Optional: Verify that the authenticated user is the contractor associated with this payment
    // const userId = req.user.id;
    // const payment = await Payment.findById(paymentId);
    // if (!payment || payment.contractor.toString() !== userId) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }

    const updatedPayment = await paymentService.declinePaymentByContractor(paymentId, reason);
    res.status(200).json({
      message: 'Payment declined by contractor.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error declining payment (contractor):', error);
    res.status(500).json({ message: 'Failed to decline payment by contractor', error });
  }
};

/**
 * Send a payment (Admin action) to set status to 'AwaitingAcknowledgment'.
 */
export const sendPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    if (payment.status !== 'Pending') {
      res.status(400).json({ message: 'Only pending payments can be sent' });
      return;
    }

    payment.status = 'AwaitingAcknowledgment';
    await payment.save();

    res.status(200).json({
      message: 'Payment sent successfully.',
      payment,
    });
  } catch (error) {
    console.error('Error sending payment:', error);
    res.status(500).json({ message: 'Failed to send payment', error });
  }
};


/**
 * Delete a payment (Admin only).
 */
export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const result = await paymentService.deletePayment(paymentId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Failed to delete payment', error });
  }
};

/**
 * Edit a payment's details (Admin only).
 */
export const editPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const updateData = req.body;

    const updatedPayment = await paymentService.editPayment(paymentId, updateData);
    res.status(200).json({
      message: 'Payment updated successfully.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error editing payment:', error);
    res.status(500).json({ message: 'Failed to edit payment', error });
  }
};