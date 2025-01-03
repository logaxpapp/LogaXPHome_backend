// src/routes/teamRoutes.ts

import express from 'express';
import * as teamController from '../controllers/teamController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Team Routes
router.post('/', authorizeRoles(UserRole.Admin, UserRole.Contractor), teamController.createTeamHandler);
router.get('/', authorizeRoles(UserRole.Admin, UserRole.Contractor), teamController.getTeamsHandler);
router.get('/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), teamController.getTeamByIdHandler);
router.put('/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), teamController.updateTeamHandler);
router.delete('/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), teamController.deleteTeamHandler);

// Team Member Management
router.post('/:id/members', authorizeRoles(UserRole.Admin, UserRole.Contractor), teamController.addMemberToTeamHandler);
router.delete('/:id/members', authorizeRoles(UserRole.Admin, UserRole.Contractor), teamController.removeMemberFromTeamHandler);

router.put(
    '/:id/members/role',
    authorizeRoles(UserRole.Admin, UserRole.Contractor),
    teamController.updateMemberRoleHandler
  );

  router.delete(
    '/:id/members',
    authorizeRoles(UserRole.Admin, UserRole.Contractor),
    teamController.removeMemberFromTeamHandler
  );
  

export default router;
