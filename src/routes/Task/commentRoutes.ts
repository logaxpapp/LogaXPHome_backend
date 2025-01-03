// src/routes/Task/commentRoutes.ts

import { Router } from 'express';
import {
  createCommentHandler,
  deleteCommentHandler,
  editCommentHandler,
  createReplyHandler,
  toggleLikeCommentHandler,
  fetchCommentsHandler,
} from '../../controllers/Task/commentController';
import { authenticateJWT } from '../../middlewares/authMiddleware';


const router = Router();

// Apply authentication middleware
router.use(authenticateJWT);

/**
 * @route   POST /api/comments
 * @desc    Add a comment to a card
 * @access  Private
 */
router.post('/', createCommentHandler);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:commentId', deleteCommentHandler);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Edit a comment
 * @access  Private
 */
router.put('/:commentId', editCommentHandler);

/**
 * @route   POST /api/comments/:parentCommentId/replies
 * @desc    Add a reply to a comment
 * @access  Private
 */
router.post('/:parentCommentId/replies', createReplyHandler);

/**
 * @route   POST /api/comments/:commentId/like
 * @desc    Toggle like on a comment
 * @access  Private
 */
router.post('/:commentId/like', toggleLikeCommentHandler);

/**
 * @route   GET /api/comments/:cardId/comments
 * @desc    Fetch all comments for a card
 * @access  Private
 */
router.get('/:cardId/comments', fetchCommentsHandler);

export default router;
