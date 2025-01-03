
///  src\routes\contractsRoutes.ts

import express from 'express';
import * as contractorController from '../controllers/contractorController';
import * as contractController from '../controllers/contractController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Contractor Routes
router.get('/contractors', authorizeRoles(UserRole.Admin), contractorController.getContractors);
router.get('/contractors/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), contractorController.getContractorByIdHandler);
router.put('/contractors/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), contractorController.updateContractor);

router.get('/contractor/:contractorId', authorizeRoles(UserRole.Admin), contractController.getContractsByContractor);

// Contract Routes
router.post('/create', authorizeRoles(UserRole.Admin), contractController.createContract);
router.get('/', contractController.getContracts);
router.get('/contractbyID/:id', authorizeRoles(UserRole.Admin, UserRole.Contractor), contractController.getContractByID);

router.put('/:id', authorizeRoles(UserRole.Admin), contractController.updateContract);
router.delete('/:id', authorizeRoles(UserRole.Admin), contractController.deleteContract);

// Contract-Specific Actions
router.put('/:id/status', authorizeRoles(UserRole.Admin), contractController.updateContractStatus);
router.put('/:id/accept', authorizeRoles(UserRole.Contractor), contractController.acceptContract);
router.put('/:id/decline', authorizeRoles(UserRole.Contractor), contractController.declineContract);

export default router;
