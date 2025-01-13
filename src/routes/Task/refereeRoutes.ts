import express from 'express';
import {
  addRefereeHandler,
  getRefereesHandler,
  updateRefereeHandler,
  deleteRefereeHandler,
  getRefereeByIdHandler
} from '../../controllers/refereeController';
import { authenticateJWT } from '../../middlewares/authMiddleware';

const router = express.Router();

// Routes for managing referees

// Get all referees for the authenticated user
router.get('/', authenticateJWT, getRefereesHandler);

// Get a referee by ID
router.get('/:refereeId', authenticateJWT, getRefereeByIdHandler);

// Add a new referee
router.post('/', authenticateJWT, addRefereeHandler);

// Update a referee by ID
router.put('/:refereeId', authenticateJWT, updateRefereeHandler);

// Delete a referee by ID
router.delete('/:refereeId', authenticateJWT, deleteRefereeHandler);

export default router;
