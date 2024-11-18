import express from 'express';
import {
  createRoleHandler,
  getAllRolesHandler,
  getRoleByIdHandler,
  updateRoleHandler,
  deleteRoleHandler,
} from '../controllers/roleController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

router.post('/', authenticateJWT, authorizeRoles(UserRole.Admin), createRoleHandler);
router.get('/', authenticateJWT, authorizeRoles(UserRole.Admin), getAllRolesHandler);
router.get('/:id', authenticateJWT, authorizeRoles(UserRole.Admin), getRoleByIdHandler);
router.put('/:id', authenticateJWT, authorizeRoles(UserRole.Admin), updateRoleHandler);
router.delete('/:id', authenticateJWT, authorizeRoles(UserRole.Admin), deleteRoleHandler);

export default router;
