// src/routes/appraisalMetricRoutes.ts

import express from 'express';
import {
  createAppraisalMetricHandler,
  getAppraisalMetricsHandler,
  getAppraisalMetricByIdHandler,
  updateAppraisalMetricHandler,
  deleteAppraisalMetricHandler,
} from '../controllers/appraisalMetricController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';
import { check } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/appraisal-metrics
 * @desc    Create a new appraisal metric
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    // Validation middleware
    check('metric_name', 'Metric name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('scale', 'Scale must be a number').optional().isNumeric(),
    check('associated_questions', 'Associated questions must be an array of IDs')
      .optional()
      .isArray(),
    // Additional validation for each question ID
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.body.associated_questions && Array.isArray(req.body.associated_questions)) {
        for (const questionId of req.body.associated_questions) {
          if (!/^[0-9a-fA-F]{24}$/.test(questionId)) {
            res.status(400).json({ message: `Invalid AppraisalQuestion ID: ${questionId}` });
            return; // Terminate after sending response
          }
        }
      }
      next();
    },
  ],
  createAppraisalMetricHandler
);

/**
 * @route   GET /api/appraisal-metrics
 * @desc    Get all appraisal metrics with optional filters
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin, UserRole.User),
  getAppraisalMetricsHandler
);

/**
 * @route   GET /api/appraisal-metrics/:id
 * @desc    Get a single appraisal metric by ID
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getAppraisalMetricByIdHandler
);

/**
 * @route   PUT /api/appraisal-metrics/:id
 * @desc    Update an appraisal metric by ID
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    // Validation middleware
    check('metric_name', 'Metric name must be a non-empty string').optional().not().isEmpty(),
    check('description', 'Description must be a non-empty string').optional().not().isEmpty(),
    check('scale', 'Scale must be a number').optional().isNumeric(),
    check('associated_questions', 'Associated questions must be an array of IDs')
      .optional()
      .isArray(),
    // Additional validation for each question ID
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.body.associated_questions && Array.isArray(req.body.associated_questions)) {
        for (const questionId of req.body.associated_questions) {
          if (!/^[0-9a-fA-F]{24}$/.test(questionId)) {
            res.status(400).json({ message: `Invalid AppraisalQuestion ID: ${questionId}` });
            return; // Terminate after sending response
          }
        }
      }
      next();
    },
  ],
  updateAppraisalMetricHandler
);

/**
 * @route   DELETE /api/appraisal-metrics/:id
 * @desc    Delete an appraisal metric by ID
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  deleteAppraisalMetricHandler
);

export default router;
