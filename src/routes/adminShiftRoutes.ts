// src/routes/adminShiftRoutes.ts

import { Router } from 'express';
import {
  createShiftTypeHandler,
  getShiftTypesHandler,
  updateShiftTypeHandler,
  deleteShiftTypeHandler,
} from '../controllers/admin/shiftTypeController';
import {
  createShiftHandler,
  getShiftsHandler,
  updateShiftHandler,
  deleteShiftHandler,
  assignShiftHandler,
  assignShiftToAllHandler,
  approveShiftAssignmentHandler,
  rejectShiftAssignmentHandler,
  createMultipleShiftsHandler,
} from '../controllers/admin/shiftController';

import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = Router();

// Apply Authentication Middleware
router.use(authenticateJWT);

// Shift Types Routes
router.post('/types', authorizeRoles(UserRole.Admin), createShiftTypeHandler);
router.get('/types', authorizeRoles(UserRole.Admin, UserRole.User), getShiftTypesHandler);
router.put('/types/:id', authorizeRoles(UserRole.Admin), updateShiftTypeHandler);
router.delete('/types/:id', authorizeRoles(UserRole.Admin), deleteShiftTypeHandler);

// New route to create multiple shifts
router.post('/multiple', authorizeRoles(UserRole.Admin), createMultipleShiftsHandler);

// Shifts Routes
router.post('/', authorizeRoles(UserRole.Admin), createShiftHandler); // Create Shift

// Allow both Admin and User roles to access the `GET /shifts` route
router.get('/', authenticateJWT, getShiftsHandler); // Temporarily bypass role check

router.put('/:id', authorizeRoles(UserRole.Admin), updateShiftHandler); // Update Shift
router.delete('/:id', authorizeRoles(UserRole.Admin), deleteShiftHandler); // Delete Shift

// Assign Shift to Employee
router.post('/assign', authorizeRoles(UserRole.Admin), assignShiftHandler);
router.post('/assign/all', authorizeRoles(UserRole.Admin), assignShiftToAllHandler);

// Approve/Reject Shift Assignment
router.put('/:id/approve', authorizeRoles(UserRole.Admin), approveShiftAssignmentHandler);
router.put('/:id/reject', authorizeRoles(UserRole.Admin), rejectShiftAssignmentHandler);

export default router;
