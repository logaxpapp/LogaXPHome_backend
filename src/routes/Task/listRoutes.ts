// src/routes/listRoutes.ts
import { Router } from 'express';
import {
  createListHandler,
  getListHandler,
  updateListHandler,
  deleteListHandler,
  getListsByHeaderHandler, // Added for fetching lists by header
} from '../../controllers/Task/listController';
import { authenticateJWT } from '../../middlewares/authMiddleware';

const router = Router();

// Apply authentication middleware
router.use(authenticateJWT);

/**
 * @route   POST /api/lists
 * @desc    Create a new list
 * @access  Private
 */
router.post('/', createListHandler);

/**
 * @route   GET /api/lists/:listId
 * @desc    Get list details
 * @access  Private
 */
router.get('/:listId', getListHandler);

/**
 * @route   GET /api/lists/:boardId/:header
 * @desc    Get lists by board and header
 * @access  Private
 */
router.get('/:boardId/:header', getListsByHeaderHandler);

/**
 * @route   PUT /api/lists/:listId
 * @desc    Update list details
 * @access  Private
 */
router.put('/:listId/header', updateListHandler);

router.put('/:listId/', updateListHandler);

/**
 * @route   DELETE /api/lists/:listId
 * @desc    Delete a list
 * @access  Private
 */
router.delete('/:listId', deleteListHandler);

export default router;
