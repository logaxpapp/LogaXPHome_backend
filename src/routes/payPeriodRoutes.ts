import express from 'express';
import {
  createPayPeriodController,
  closePayPeriodController,
  processPayPeriodController,
  getAllPayPeriodsController,
  getPayPeriodByIdController,
  getEmployeePayPeriodSummaryController,
} from '../controllers/payPeriodController';
import {
  validatePayPeriodStatus,
  ensureOpenPayPeriod,
  ensureClosedPayPeriod,
  validateShiftsForPayPeriod,
  validateTimeEntriesForShifts,
  preventModificationOfClosedPayPeriods,
} from '../middlewares/payPeriodValidation';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { UserRole } from '../types/enums';

const router = express.Router();

// @route   POST /api/payPeriods
// @desc    Create a new PayPeriod
// @access  Private/Admin
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  createPayPeriodController
);

// @route   PATCH /api/payPeriods/:id/close
// @desc    Close an existing PayPeriod
// @access  Private/Admin
router.patch(
  '/:id/close',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  validatePayPeriodStatus, // Validate payPeriod exists and is in the correct state
  ensureOpenPayPeriod, // Ensure PayPeriod is open before closing
  closePayPeriodController
);

// @route   POST /api/payPeriods/:id/process
// @desc    Process a PayPeriod (calculate payroll)
// @access  Private/Admin
router.post(
  '/:id/process',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  validatePayPeriodStatus, // Validate payPeriod exists and is in the correct state
  ensureClosedPayPeriod, // Ensure PayPeriod is closed before processing
  validateShiftsForPayPeriod, // Validate shifts are assigned correctly
  validateTimeEntriesForShifts, // Validate time entries for all shifts
  processPayPeriodController
);

// @route   GET /api/payPeriods
// @desc    Get all PayPeriods
// @access  Private/Admin
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getAllPayPeriodsController
);

// @route   GET /api/payPeriods/:id
// @desc    Get a single PayPeriod by ID
// @access  Private/Admin
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getPayPeriodByIdController
);

// @route   GET /api/payPeriods/:id/summary/:employeeId
// @desc    Get summary for an employee in a specific PayPeriod
// @access  Private/Admin
router.get(
  '/:id/summary/:employeeId',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  validatePayPeriodStatus,
  getEmployeePayPeriodSummaryController
);

export default router;
