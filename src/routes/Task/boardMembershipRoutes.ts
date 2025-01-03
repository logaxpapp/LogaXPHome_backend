// /src/routes/boardMembershipRoutes.ts

import { Router } from 'express';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import {
  addMemberToBoardHandler,
  removeMemberFromBoardHandler,
  getBoardMembersHandler,
} from '../../controllers/Task/boardMembershipController';

const router = Router();

// Use your JWT auth for all routes
router.use(authenticateJWT);

/**
 * Add a member to a board
 * POST /boards/:boardId/members
 * Body { userId }
 */
router.post('/:boardId/members', addMemberToBoardHandler);

/**
 * Remove a member from a board
 * DELETE /boards/:boardId/members/:userId
 */
router.delete('/:boardId/members/:userId', removeMemberFromBoardHandler);

/**
 * Fetch all members of a board
 * GET /boards/:boardId/members
 */
router.get('/:boardId/members', getBoardMembersHandler);

export default router;
