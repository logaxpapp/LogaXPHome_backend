// src/routes/paymentRoutes.ts

import express from 'express';
import * as paymentController from '../controllers/paymentController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

// All routes protected by JWT
router.use(authenticateJWT);

/**
 * Create a payment (Admin only).
 */
router.post('/', authorizeRoles(UserRole.Admin), paymentController.createPayment);

/**
 * Get all payments for a specific contract (Admin or Contractor).
 */
router.get(
  '/contract/:contractId',
  authorizeRoles(UserRole.Admin, UserRole.Contractor),
  paymentController.getPaymentsForContract
);

/**
 * Admin confirm / decline payment
 */
router.put(
  '/:paymentId/confirm',
  authorizeRoles(UserRole.Admin),
  paymentController.confirmPayment
);
router.put(
  '/:paymentId/decline',
  authorizeRoles(UserRole.Admin),
  paymentController.declinePayment
);

/**
 * Contractor acknowledges the payment.
 */
router.put(
  '/:paymentId/acknowledge',
  authorizeRoles(UserRole.Contractor),
  paymentController.acknowledgePayment
);

/**
 * Contractor accepts the payment.
 */
router.put(
  '/:paymentId/contractorAccept',
  authorizeRoles(UserRole.Contractor),
  paymentController.acceptPaymentByContractor
);

/**
 * Contractor declines the payment.
 */
router.put(
  '/:paymentId/contractorDecline',
  authorizeRoles(UserRole.Contractor),
  paymentController.declinePaymentByContractor
);

/**
 * Get contract payment summary (Admin or Contractor).
 */
router.get(
  '/summary/:contractId',
  authorizeRoles(UserRole.Admin, UserRole.Contractor),
  paymentController.getContractPaymentSummary
);

/**
 * Send a payment reminder to the contractor.
 * (Admin only)
 */
router.put(
  '/:paymentId/send',
  authorizeRoles(UserRole.Admin),
  paymentController.sendPayment
);

/**
 * Delete a payment (Admin only).
 */
router.delete(
  '/:paymentId',
  authorizeRoles(UserRole.Admin),
  paymentController.deletePayment
);

/**
 * Edit a payment's details (Admin only).
 */
router.put(
  '/:paymentId',
  authorizeRoles(UserRole.Admin),
  paymentController.editPayment
);

export default router;
