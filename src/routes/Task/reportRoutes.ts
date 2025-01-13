// src/routes/Task/reportRoutes.ts

import { Router } from 'express';
import {
  generateReportHandler,
  fetchAllReportsHandler,
  fetchReportByIdHandler,
  deleteReportHandler
} from '../../controllers/Task/reportController';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { UserRole } from '../../types/enums'; // or wherever you define user roles

const router = Router();

router.use(authenticateJWT); // must be logged in

// Example: Only Admin can generate & delete
router.post('/generate', authorizeRoles(UserRole.Admin), generateReportHandler);
router.get('/', authorizeRoles(UserRole.Admin), fetchAllReportsHandler);
router.get('/:reportId', authorizeRoles(UserRole.Admin), fetchReportByIdHandler);
router.delete('/:reportId', authorizeRoles(UserRole.Admin), deleteReportHandler);

export default router;
