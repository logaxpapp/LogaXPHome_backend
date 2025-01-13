// /src/routes/boardMembershipRoutes.ts

import { Router } from 'express';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { authorizeRoles } from '../../middlewares/authorizeRoles';
import { UserRole } from '../../types/enums';
import {
  addMemberToBoardHandler,
  removeMemberFromBoardHandler,
  getBoardMembersHandler,
  setBoardTeamHandler,
  removeBoardTeamHandler,
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
 * Set the board team
 * POST /boards/:boardId/team
 * Body { teamId }
 * Only the board owner or team leader can set the team
 * The team must be in the same organization as the board
 */
 
router.post('/:boardId/team', authorizeRoles(UserRole.Admin, UserRole.Contractor), setBoardTeamHandler);

/**
 * Remove the board team
 * DELETE /boards/:boardId/team
 * Only the board owner or team leader can remove the team
 */
router.delete('/:boardId/team',authorizeRoles(UserRole.Admin, UserRole.Contractor), removeBoardTeamHandler);

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
