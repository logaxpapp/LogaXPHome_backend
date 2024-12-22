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
 * Contractor acknowledges the payment (existing).
 */
router.put(
  '/:paymentId/acknowledge',
  authorizeRoles(UserRole.Contractor),
  paymentController.acknowledgePayment
);

/**
 * Contractor accept / decline payment (NEW).
 */
router.put(
  '/:paymentId/contractorAccept',
  authorizeRoles(UserRole.Contractor),
  paymentController.acceptPaymentByContractor
);
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

export default router;
