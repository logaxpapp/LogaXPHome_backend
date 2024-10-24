// src/routes/adminRoutes.ts

import { Router } from 'express';
import {
  getDeletionRequestsHandler,
  approveDeletionHandler,
  rejectDeletionHandler,
  createUserAndSendInviteHandler,
  bulkCreateUsersFromCSVHandler,
  getAllUsersHandler,
  changeUserRoleHandler,
  resetUserPasswordHandler,
  exportUserDataHandler,
  suspendUserHandler,
  reactivateUserHandler,
  editUserProfileHandler,
} from '../controllers/adminController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../models/User';
import multer from 'multer';

// Configure Multer for CSV uploads
const upload = multer({ dest: 'uploads/csv/' });

const router = Router();

// Apply Authentication and Authorization Middleware
router.use(authenticateJWT);
router.use(authorizeRoles(UserRole.Admin));

// Account Deletion Requests
router.get('/deletion-requests', getDeletionRequestsHandler);
router.put('/deletion-requests/:id/approve', approveDeletionHandler);
router.put('/deletion-requests/:id/reject', rejectDeletionHandler);

// User Management
router.post('/users', createUserAndSendInviteHandler);
router.post('/users/bulk-create', upload.single('file'), bulkCreateUsersFromCSVHandler);
router.get('/users', getAllUsersHandler);
router.put('/users/:id/role', changeUserRoleHandler);
router.post('/users/:id/reset-password', resetUserPasswordHandler);

// Export Users
router.get('/users/export', exportUserDataHandler);

// === New Routes ===

// Suspend User
router.put('/users/:id/suspend', suspendUserHandler);

// Reactivate User
router.put('/users/:id/reactivate', reactivateUserHandler);

// Edit User Profile
router.put('/users/:id/profile', editUserProfileHandler);

export default router;
