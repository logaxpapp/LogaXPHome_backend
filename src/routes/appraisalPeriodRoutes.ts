// src/routes/appraisalPeriodRoutes.ts

import express from 'express';
import {
  createAppraisalPeriod,
  getAppraisalPeriods,
  updateAppraisalPeriod,
  deleteAppraisalPeriod,
} from '../controllers/appraisalPeriodController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';
import { check, validationResult } from 'express-validator';

const router = express.Router();

/**
 * Middleware to handle validation results
 */
const validate: express.RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Exit the middleware after sending the response
  }
  next(); // Proceed to the next middleware or route handler
};

/**
 * @route   POST /api/appraisal-periods
 * @desc    Create a new appraisal period
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('startDate', 'Start date must be a valid date').isISO8601(),
    check('endDate', 'End date must be a valid date').isISO8601(),
    check('submissionDeadline', 'Submission deadline must be a valid date').isISO8601(),
    check('reviewDeadline', 'Review deadline must be a valid date').isISO8601(),
    check('isActive', 'isActive must be a boolean').isBoolean(),
    // Custom validations
    check('endDate').custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    check('submissionDeadline').custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const submissionDeadline = new Date(value);
      if (submissionDeadline <= startDate) {
        throw new Error('Submission deadline must be after start date');
      }
      return true;
    }),
    check('reviewDeadline').custom((value, { req }) => {
      const submissionDeadline = new Date(req.body.submissionDeadline);
      const reviewDeadline = new Date(value);
      if (reviewDeadline <= submissionDeadline) {
        throw new Error('Review deadline must be after submission deadline');
      }
      return true;
    }),
  ],
  validate, // Correctly typed middleware
  createAppraisalPeriod
);

/**
 * @route   PUT /api/appraisal-periods/:id
 * @desc    Update an appraisal period
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    // Optional validations
    check('name', 'Name cannot be empty').optional().not().isEmpty(),
    check('startDate', 'Start date must be a valid date').optional().isISO8601(),
    check('endDate', 'End date must be a valid date').optional().isISO8601(),
    check('submissionDeadline', 'Submission deadline must be a valid date').optional().isISO8601(),
    check('reviewDeadline', 'Review deadline must be a valid date').optional().isISO8601(),
    check('isActive', 'isActive must be a boolean').optional().isBoolean(),
    // Custom validations
    check('endDate').optional().custom((value, { req }) => {
      if (req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
    check('submissionDeadline').optional().custom((value, { req }) => {
      if (req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const submissionDeadline = new Date(value);
        if (submissionDeadline <= startDate) {
          throw new Error('Submission deadline must be after start date');
        }
      }
      return true;
    }),
    check('reviewDeadline').optional().custom((value, { req }) => {
      if (req.body.submissionDeadline) {
        const submissionDeadline = new Date(req.body.submissionDeadline);
        const reviewDeadline = new Date(value);
        if (reviewDeadline <= submissionDeadline) {
          throw new Error('Review deadline must be after submission deadline');
        }
      }
      return true;
    }),
  ],
  validate, 
  updateAppraisalPeriod
);

/**
 * @route   GET /api/appraisal-periods
 * @desc    Get all appraisal periods
 * @access  Private (Admin)
 */
router.get('/', authenticateJWT, authorizeRoles(UserRole.Admin, UserRole.User), getAppraisalPeriods);

/**
 * @route   DELETE /api/appraisal-periods/:id
 * @desc    Delete an appraisal period
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateJWT, authorizeRoles(UserRole.Admin), deleteAppraisalPeriod);

export default router;
