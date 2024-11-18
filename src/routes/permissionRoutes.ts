// src/routes/permissionRoutes.ts

import express from 'express';
import {
  createPermissionHandler,
  getAllPermissionsHandler,
  updatePermissionHandler,
  deletePermissionHandler,
} from '../controllers/permissionController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticateJWT);

router.post('/', createPermissionHandler);
router.get('/', getAllPermissionsHandler);
router.put('/:id', updatePermissionHandler);
router.delete('/:id', deletePermissionHandler);

export default router;
