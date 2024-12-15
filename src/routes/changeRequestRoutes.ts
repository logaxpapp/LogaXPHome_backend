// src/routes/changeRequestRoutes.ts

import express from 'express';
import {
  createChangeRequestHandler,
  getAllChangeRequestsHandler,
  approveChangeRequestHandler,
  rejectChangeRequestHandler,
  deleteChangeRequestHandler,
  getMyChangeRequestsHandler,
  softDeleteChangeRequestHandler,
  getSoftDeletedChangeRequestsHandler,
  permanentlyDeleteChangeRequestHandler,
  restoreChangeRequestHandler,
  getChangeRequestByIdHandler,
} from '../controllers/changeRequestController';
import { createChangeRequestValidators } from '../validators/changeRequestValidators';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';
import { body } from 'express-validator';

const router = express.Router();

/**
 * @route POST /api/change-requests
 * @desc Submit a profile change request
 * @access Authenticated Users
 */
router.post(
  '/',
  authenticateJWT,
  createChangeRequestValidators,
  createChangeRequestHandler
);

/**
 * @route GET /api/change-requests
 * @desc Get all pending change requests
 * @access Admins only
 */
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  getAllChangeRequestsHandler
);

/**
 * @route POST /api/change-requests/:id/approve
 * @desc Approve a change request
 * @access Admins only
 */
router.post(
  '/:id/approve',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    body('comments')
      .optional()
      .isString()
      .withMessage('Comments must be a string.'),
  ],
  approveChangeRequestHandler
);

/**
 * @route POST /api/change-requests/:id/reject
 * @desc Reject a change request
 * @access Admins only
 */
router.post(
  '/:id/reject',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    body('comments')
      .optional()
      .isString()
      .withMessage('Comments must be a string.'),
  ],
  rejectChangeRequestHandler
);

/**
 * @route DELETE /api/change-requests/:id
 * @desc Delete a change request
 * @access Admins only
 */
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  deleteChangeRequestHandler
);

/**
 * @route GET /api/change-requests/my
 * @desc Get all change requests submitted by the current user
 * @access Authenticated Users
 * */

router.get(
  '/my-change-requests',
  authenticateJWT,
  getMyChangeRequestsHandler
);

router.post('/:id/soft-delete', authenticateJWT, softDeleteChangeRequestHandler);
router.get('/soft-deleted', authenticateJWT, getSoftDeletedChangeRequestsHandler);
router.delete('/:id/permanent', authenticateJWT, permanentlyDeleteChangeRequestHandler);
router.post('/:id/restore', authenticateJWT, restoreChangeRequestHandler)

router.get('/:id', authenticateJWT, getChangeRequestByIdHandler);


export default router;
