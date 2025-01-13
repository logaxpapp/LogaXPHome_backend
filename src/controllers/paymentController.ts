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
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'JPY', 'CNY'];
    if (!supportedCurrencies.includes(currency)) {
      res.status(400).json({ message: 'Unsupported currency' });
      return;
    }

    const payment = await paymentService.createPayment(req.body);
    res.status(201).json(payment);
    return; // Done sending response
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Failed to create payment', error });
    return; // Ensure we don't continue
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
    return;
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments', error });
    return;
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
    return;
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Failed to confirm payment', error });
    return;
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
    return;
  } catch (error) {
    console.error('Error declining payment:', error);
    res.status(500).json({ message: 'Failed to decline payment', error });
    return;
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
    return;
  } catch (error) {
    console.error('Error acknowledging payment:', error);
    res.status(500).json({ message: 'Failed to acknowledge payment', error });
    return;
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
    return;
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ message: 'Failed to fetch payment summary', error });
    return;
  }
};

/**
 * Contractor accepts the payment (NEW).
 */
export const acceptPaymentByContractor = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    // Optional auth check here

    const updatedPayment = await paymentService.acceptPaymentByContractor(paymentId);
    res.status(200).json({
      message: 'Payment accepted by contractor.',
      payment: updatedPayment,
    });
    return;
  } catch (error) {
    console.error('Error accepting payment (contractor):', error);
    res.status(500).json({ message: 'Failed to accept payment by contractor', error });
    return;
  }
};

/**
 * Contractor declines the payment (NEW).
 */
export const declinePaymentByContractor = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    // Optional auth check here

    const updatedPayment = await paymentService.declinePaymentByContractor(paymentId, reason);
    res.status(200).json({
      message: 'Payment declined by contractor.',
      payment: updatedPayment,
    });
    return;
  } catch (error) {
    console.error('Error declining payment (contractor):', error);
    res.status(500).json({ message: 'Failed to decline payment by contractor', error });
    return;
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
    return;
  } catch (error) {
    console.error('Error sending payment:', error);
    res.status(500).json({ message: 'Failed to send payment', error });
    return;
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
    return;
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Failed to delete payment', error });
    return;
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
    return;
  } catch (error) {
    console.error('Error editing payment:', error);
    res.status(500).json({ message: 'Failed to edit payment', error });
    return;
  }
};
