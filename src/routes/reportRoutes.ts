// src/routes/reportRoutes.ts

import express from 'express';
import {
  getApprovalStatusReport,
  getAveragePerformanceRating,
} from '../controllers/reportController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

/**
 * All report routes require Admin access
 */
router.use(authenticateJWT, authorizeRoles(UserRole.Admin));

/**
 * @route   GET /api/reports/approval-status
 * @desc    Get approval status distribution report
 * @access  Private (Admin)
 */
router.get('/approval-status', getApprovalStatusReport);

/**
 * @route   GET /api/reports/average-performance-rating
 * @desc    Get average performance ratings per appraisal period
 * @access  Private (Admin)
 */
router.get('/average-performance-rating', getAveragePerformanceRating);

export default router;
