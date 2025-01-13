// src/routes/invitationRoutes.ts

import { Router } from 'express';
import {
  createInvitationHandler,
  acceptInvitationHandler,
  declineInvitationHandler,
} from '../../controllers/Task/invitationController';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { UserRole } from '../../types/enums';

const router = Router();

/**
 * Create invitation
 * - Must be Admin or Contractor
 */
router.post(
  '/',
  authenticateJWT,               // user must be logged in
  authorizeRoles(UserRole.Admin, UserRole.Contractor),
  createInvitationHandler
);

/**
 * Accept invitation
 * - **Public** endpoint (no auth) 
 *   because brand-new people have no token or session yet
 */
router.post('/accept', acceptInvitationHandler);

/**
 * Decline invitation
 * - Also public if the user might not be logged in
 */
router.post('/decline', declineInvitationHandler);

export default router;
