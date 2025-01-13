import express from 'express';
import {
  createReferenceHandler,
  getReferenceHandler,
  updateReferenceHandler,
  deleteReferenceHandler,
  sendReferenceHandler,
  receiveReferenceHandler,
  completeReferenceHandler,
  rejectReferenceHandler,
  listReferencesHandler,
  getReferenceFormHandler,
  submitReferenceFormHandler,
  auditReferenceHandler,
} from '../../controllers/referenceController';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { UserRole } from '../../types/enums';

const router = express.Router();

// Public Routes
router.get('/form', getReferenceFormHandler); // Serve the Reference Form
router.post('/form', submitReferenceFormHandler); // Handle Reference Form Submission

// Protected Routes
router.post('/', authenticateJWT, createReferenceHandler); // Create a new reference
router.get('/:referenceId/audit', authenticateJWT, auditReferenceHandler);
router.get('/:referenceId', authenticateJWT, getReferenceHandler); // Get a reference by ID
router.put('/:referenceId', authenticateJWT, updateReferenceHandler); // Update a reference
router.delete('/:referenceId', authenticateJWT, deleteReferenceHandler); // Delete a reference
router.post('/:referenceId/send', authenticateJWT, sendReferenceHandler); // Send a reference
router.post('/:referenceId/receive', authenticateJWT, receiveReferenceHandler); // Mark a reference as received
router.post('/:referenceId/complete', authenticateJWT, completeReferenceHandler); // Mark a reference as completed
router.post('/:referenceId/reject', authenticateJWT, rejectReferenceHandler); // Reject a reference
router.get('/', authenticateJWT, listReferencesHandler); // List references with filters and pagination

export default router;
