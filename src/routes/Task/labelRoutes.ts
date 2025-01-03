// src/routes/labelRoutes.ts

import { Router } from 'express';
import {
  createLabelHandler,
  deleteLabelHandler,
  getLabelByIdHandler,
  getLabelsByBoardHandler,
} from '../../controllers/Task/labelController';
import { authenticateJWT } from '../../middlewares/authMiddleware';

const router = Router();

// Apply authentication middleware
router.use(authenticateJWT);

/**
 * @route   POST /api/labels
 * @desc    Create a new label
 * @access  Private
 */
router.post('/', createLabelHandler);

/**
 * @route   GET /api/labels/board/:boardId
 * @desc    Fetch all labels for a given board
 * @access  Private
 */
router.get('/board/:boardId', getLabelsByBoardHandler);

/**
 * @route   GET /api/labels/:labelId
 * @desc    Fetch a label by ID
 * @access  Private
 */
router.get('/:labelId', getLabelByIdHandler);

/**
 * @route   DELETE /api/labels/:labelId
 * @desc    Delete a label
 * @access  Private
 */
router.delete('/:labelId', deleteLabelHandler);

export default router;
