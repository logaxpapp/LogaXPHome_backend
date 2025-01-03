// src/routes/boardRoutes.ts
import { Router } from 'express';
import {
  createBoardHandler,
  getBoardHandler,
  updateBoardHandler,
  deleteBoardHandler,
  getAllBoardsHandler,
  updateBoardListsHandler, 
  updateHeader,
} from '../../controllers/Task/boardController';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { authorizeBoardAccess } from '../../middlewares/authorizeBoardAccess';
import { authorizeBoardOwner } from '../../middlewares/authorizeBoardOwner';


const router = Router();

// Apply authentication middleware
router.use(authenticateJWT);

/**
 * @route   POST /api/boards
 * @desc    Create a new board
 * @access  Private
 */
router.post('/', createBoardHandler);

/**
 * @route   GET /api/boards
 * @desc    Get all boards
 * @access  Private
 */
router.get('/', getAllBoardsHandler);

/**
 * @route   GET /api/boards/:boardId
 * @desc    Get board details
 * @access  Private
 */
router.get('/:boardId', authorizeBoardAccess, getBoardHandler);

/**
 * @route   PUT /api/boards/:boardId
 * @desc    Update board details
 * @access  Private
 */
router.put('/:boardId', authorizeBoardAccess, updateBoardHandler);

/**
 * @route   PUT /api/boards/:boardId/lists
 * @desc    Reorder lists on a board
 * @access  Private
 */
router.put('/:boardId/lists', authorizeBoardAccess, updateBoardListsHandler);

/**
 * @route   DELETE /api/boards/:boardId
 * @desc    Delete a board
 * @access  Private (Owner only)
 */
router.delete('/:boardId', authorizeBoardAccess, authorizeBoardOwner, deleteBoardHandler);

/**
 * @route   PUT /api/boards/lists/header
 * @desc    Update the header of a list
 * @access  Private
 */
router.put('/lists/header', authenticateJWT, updateHeader);


export default router;
