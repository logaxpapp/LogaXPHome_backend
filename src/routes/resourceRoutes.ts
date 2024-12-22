// src/routes/resourceRoutes.ts

import express from 'express';
import {
  createResourceHandler,
  getResourcesHandler,
  getResourceByIdHandler,
  updateResourceHandler,
  deleteResourceHandler,
  sendResourceToUserHandler,
  acknowledgeResourceHandler,
  getRelatedResourcesHandler,
  getUserResourcesHandler,
} from '../controllers/resourceController';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { UserRole } from '../types/enums';

const router = express.Router();

// Routes

// GET /api/resources
router.get('/', authenticateJWT, getResourcesHandler);

// GET /api/resources/user/:userId
router.get('/user', authenticateJWT, getUserResourcesHandler);

// GET /api/resources/:id
router.get('/:id', authenticateJWT, getResourceByIdHandler);

// POST /api/resources
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin), // Only Admins can create resources
  createResourceHandler
);

// PUT /api/resources/:id
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin), // Only Admins can update resources
  updateResourceHandler
);

// DELETE /api/resources/:id
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  deleteResourceHandler
);

// POST /api/resources/send
router.post('/send', authenticateJWT, sendResourceToUserHandler);

// POST /api/resources/acknowledge
router.put('/:resourceId/acknowledge', authenticateJWT, acknowledgeResourceHandler);

// GET /api/resources/:id/related
router.get('/:id/related', authenticateJWT, getRelatedResourcesHandler);




export default router;
