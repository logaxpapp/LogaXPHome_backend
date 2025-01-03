// src/routes/subContractorRoutes.ts

import express from 'express';
import * as subContractorController from '../controllers/subContractorController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// SubContractor Routes
router.post('/', authorizeRoles(UserRole.Admin, UserRole.Contractor), subContractorController.createSubContractorHandler);
router.get('/', authorizeRoles(UserRole.Admin, UserRole.Contractor), subContractorController.getSubContractorsHandler);
router.get('/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), subContractorController.getSubContractorByIdHandler);
router.put('/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), subContractorController.updateSubContractorHandler);
router.delete('/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), subContractorController.deleteSubContractorHandler);

export default router;
