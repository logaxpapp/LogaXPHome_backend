import { Router } from 'express';
import {
  clockInController,
  clockOutController,
  getTimeEntriesByEmployeeController,
  getTimeEntriesByShiftController,
  getTimeEntriesByPayPeriodController,
  deleteTimeEntryController,
  startBreakController,
  endBreakController,
  markAsAbsentController,
  fetchCurrentStatusController,
  fetchAbsencesController,
  updateTimeEntryAdminController
} from '../controllers/timeEntryController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

 // aplly globally middleware


// Admin routes
const router = Router();

router.post('/clock-in', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), clockInController);
router.put('/clock-out/:id', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), clockOutController);
router.put(
  '/admin/time-entries/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin), // Admin-only access
  updateTimeEntryAdminController
);
router.get('/employee/:employeeId', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), getTimeEntriesByEmployeeController);
router.get('/shift/:shiftId', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), getTimeEntriesByShiftController);
router.get('/payPeriod/:payPeriodId', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), getTimeEntriesByPayPeriodController);
router.delete('/:id', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), deleteTimeEntryController);
router.put('/:id/start-break', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), startBreakController);
router.put('/:id/end-break', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), endBreakController);
router.post('/mark-absent', authenticateJWT, authorizeRoles(UserRole.Admin), markAsAbsentController);
router.get('/status/:employeeId', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), fetchCurrentStatusController);
router.get('/absences/:employeeId', authenticateJWT, authorizeRoles(UserRole.User, UserRole.Admin), fetchAbsencesController);

export default router;
