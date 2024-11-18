// src/routes/appraisalQuestionRoutes.ts

import express from 'express';
import {
  createAppraisalQuestionHandler,
  getAppraisalQuestionsHandler,
  getAppraisalQuestionByIdHandler, // Correct import
  updateAppraisalQuestionHandler,
  deleteAppraisalQuestionHandler,
} from '../controllers/appraisalQuestionController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';
import { check } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/appraisal-questions
 * @desc    Create a new appraisal question
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    // Validation middleware
    check('question_text', 'Question text is required').not().isEmpty(),
    check('question_type', 'Question type is required and must be Rating, Text, or Multiple Choice')
      .isIn(['Rating', 'Text', 'Multiple Choice']),
    // If question_type is Multiple Choice, options are required
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.body.question_type === 'Multiple Choice') {
        await check('options', 'Options must be an array with at least two choices')
          .isArray({ min: 2 })
          .run(req);
      }
      next();
    },
  ],
  createAppraisalQuestionHandler
);

/**
 * @route   GET /api/appraisal-questions
 * @desc    Get all appraisal questions with optional filters
 * @access  Private (Admin)
 */
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin, UserRole.User),
  getAppraisalQuestionsHandler
);

/**
 * @route   GET /api/appraisal-questions/:id
 * @desc    Get a single appraisal question by ID
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getAppraisalQuestionByIdHandler // Correct handler for GET by ID
);

/**
 * @route   PUT /api/appraisal-questions/:id
 * @desc    Update an appraisal question by ID
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    // Validation middleware
    check('question_text', 'Question text is required').optional().not().isEmpty(),
    check('question_type', 'Question type must be Rating, Text, or Multiple Choice')
      .optional()
      .isIn(['Rating', 'Text', 'Multiple Choice']),
    // If question_type is Multiple Choice, options are required
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.body.question_type === 'Multiple Choice') {
        await check('options', 'Options must be an array with at least two choices')
          .optional()
          .isArray({ min: 2 })
          .run(req);
      }
      next();
    },
  ],
  updateAppraisalQuestionHandler
);

/**
 * @route   DELETE /api/appraisal-questions/:id
 * @desc    Delete an appraisal question by ID
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  deleteAppraisalQuestionHandler
);

export default router;
