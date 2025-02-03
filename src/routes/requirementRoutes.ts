// "I want the vital message at all time."
// src/routes/requirementRoutes.ts

import express from 'express';
import {
  createRequirementController,
  getAllRequirementsController,
  getRequirementByIdController,
  updateRequirementController,
  deleteRequirementController,
} from '../controllers/requirementController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

// All require JWT
router.use(authenticateJWT);

/** CRUD for Requirements */
router.post('/', createRequirementController);
router.get('/', getAllRequirementsController);
router.get('/:id', getRequirementByIdController);
router.put('/:id', updateRequirementController);
router.delete('/:id', deleteRequirementController);

export default router;
