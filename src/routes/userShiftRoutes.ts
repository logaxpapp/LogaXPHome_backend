// src/routes/userShiftRoutes.ts

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { checkGoogleAccessToken } from '../middlewares/refreshAccessTokenMiddleware';
import { UserRole } from '../types/enums';
import {
  viewScheduleHandler,
  requestShiftHandler,
  assignShiftHandler,
  fetchShiftsByEmployeeController,
} from '../controllers/user/shiftController';

const router = Router();

// Apply Authentication Middleware
router.use(authenticateJWT);

// Request to Pick an Open Shift
router.post('/request', authorizeRoles(UserRole.User, UserRole.Admin), requestShiftHandler);

// Assign to Open Shift
router.post('/assign', authorizeRoles(UserRole.User, UserRole.Admin), assignShiftHandler);

// Apply checkGoogleAccessToken Middleware
router.use(checkGoogleAccessToken);

// Fetch Shifts by Employee
router.get('/employee/:employeeId', authorizeRoles(UserRole.User, UserRole.Admin), fetchShiftsByEmployeeController);

// View Schedule
router.get('/schedule', authorizeRoles(UserRole.User, UserRole.Admin), viewScheduleHandler);

export default router;
