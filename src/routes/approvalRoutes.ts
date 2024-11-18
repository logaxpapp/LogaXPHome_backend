// src/routes/approvalRoutes.ts

import express from 'express';
import {
  createApprovalRequestHandler,
  getAllApprovalRequestsHandler,
  getUserApprovalRequestsHandler,
  getApprovalRequestByIdHandler,
  updateApprovalRequestStatusHandler,
  deleteApprovalRequestHandler,
  getUserPendingApprovalsHandler,
} from '../controllers/approvalController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';
import multer from 'multer';
import { check } from 'express-validator';

const router = express.Router();

// Configure Multer for file uploads (memory storage for controller to handle)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @route   POST /api/approval-requests
 * @desc    Create a new approval request
 * @access  Private (User)
 */
router.post(
  '/',
  authenticateJWT,
  upload.single('file'), // 'file' field for uploads (e.g., receipt)
  [
    // Validation middleware
    check('request_type', 'Request type is required').isIn(['Leave', 'Expense', 'Appraisal', 'Other']),
    check('request_details', 'Request details are required').not().isEmpty(),
    check('workflow', 'Workflow must be an array with at least one approver').isArray({ min: 1 }),
    check('workflow.*.approver', 'Approver must be a valid user ID').isMongoId(),
    // Additional validations based on request_type
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const { request_type } = req.body;

      if (request_type === 'Leave') {
        await check('request_data.leave_type', 'Leave type is required').not().isEmpty().run(req);
        await check('request_data.start_date', 'Start date is required and must be a valid date').isISO8601().run(req);
        await check('request_data.end_date', 'End date is required and must be a valid date').isISO8601().run(req);
        await check('request_data.reason', 'Reason is required').not().isEmpty().run(req);
      } else if (request_type === 'Expense') {
        await check('request_data.amount', 'Amount is required and must be a positive number').isFloat({ gt: 0 }).run(req);
        await check('request_data.currency', 'Currency is required').not().isEmpty().run(req);
        await check('request_data.expense_category', 'Expense category is required').not().isEmpty().run(req);
        // 'receipt' is handled by Multer
      } else if (request_type === 'Appraisal') {
        await check('request_data.period', 'Appraisal period is required').not().isEmpty().run(req);
        await check('request_data.comments', 'Comments are required').not().isEmpty().run(req);
      } else if (request_type === 'Other') {
        await check('request_data.details', 'Details are required').not().isEmpty().run(req);
      }

      next();
    },
  ],
  createApprovalRequestHandler
);

/**
 * @route   GET /api/approval-requests/all
 * @desc    Get all approval requests (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/all',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getAllApprovalRequestsHandler
);

/**
 * @route   GET /api/approval-requests/pending
 * @desc    Get all pending approval requests (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/pending',
  authenticateJWT,
  authorizeRoles(UserRole.Admin, UserRole.Approver),
  getUserPendingApprovalsHandler
);

/**
 * @route   GET /api/approval-requests/my-approvals
 * @desc    Get approval requests for the authenticated user or approver
 * @access  Private (User/Admin/Approver)
 */
router.get(
  '/my-approvals',
  authenticateJWT,
  authorizeRoles(UserRole.User, UserRole.Admin, UserRole.Approver),
  getUserApprovalRequestsHandler
);

/**
 * @route   GET /api/approval-requests/:id
 * @desc    Get a specific approval request by ID
 * @access  Private (User/Admin/Approver)
 */
router.get(
  '/:id',
  authenticateJWT,
  getApprovalRequestByIdHandler
);

/**
 * @route   PATCH /api/approval-requests/:id/approve
 * @desc    Update the status of an approval request (Approve/Reject)
 * @access  Private (Admin/Approver)
 */
router.patch(
  '/:id/approve',
  authenticateJWT,
  authorizeRoles(UserRole.Admin, UserRole.Approver),
  [
    // Validation middleware
    check('status', 'Status must be either Approved or Rejected').isIn(['Approved', 'Rejected']),
    // Optional: Validate 'comments' if provided
    check('comments', 'Comments must be a string').optional().isString(),
  ],
  updateApprovalRequestStatusHandler
);

/**
 * @route   DELETE /api/approval-requests/:id
 * @desc    Delete an approval request
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  deleteApprovalRequestHandler
);

export default router;
