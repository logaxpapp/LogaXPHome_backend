// src/routes/incidentRoutes.ts

import express from 'express';
import {
  createIncidentHandler,
  getIncidentsHandler,
  getIncidentByIdHandler,
  updateIncidentHandler,
  deleteIncidentHandler,
} from '../controllers/incidentController';
import { UserRole } from '../types/enums';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

// Routes

// GET /api/incidents
router.get('/', authenticateJWT, getIncidentsHandler);

// GET /api/incidents/:id
router.get('/:id', authenticateJWT, getIncidentByIdHandler);

// POST /api/incidents
router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin), // Only Admins can create incidents
  createIncidentHandler
);

// PUT /api/incidents/:id
router.put(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  updateIncidentHandler
);

// DELETE /api/incidents/:id
router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  deleteIncidentHandler
);

export default router;
