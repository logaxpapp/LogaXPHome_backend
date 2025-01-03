// /src/routes/activityRoutes.ts

import { Router } from 'express';
import {
  createActivityHandler,
  getActivitiesHandler,
  getActivityByIdHandler,
  deleteActivityHandler,
} from '../../controllers/Task/activityController';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { UserRole } from '../../types/enums';

const router = Router();

// Apply authentication middleware

router.use(authenticateJWT);

// CREATE
router.post('/',authorizeRoles(UserRole.Admin), createActivityHandler);

// GET MANY
router.get('/', getActivitiesHandler);

// GET ONE
router.get('/:activityId', getActivityByIdHandler);

// DELETE
router.delete('/:activityId', authorizeRoles(UserRole.Admin), deleteActivityHandler);

export default router;
