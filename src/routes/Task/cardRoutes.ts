// src/routes/cardRoutes.ts

import { Router } from 'express';
import {
  createCardHandler,
  getCardHandler,
  updateCardHandler,
  deleteCardHandler,
  assignUserToCardHandler,
  unassignUserFromCardHandler,
  // Sub-task handlers
  addSubTaskHandler,
  updateSubTaskHandler,
  deleteSubTaskHandler,
  // Time log handlers
  logTimeHandler,
  // Custom field handlers
  addCustomFieldHandler,
  updateCustomFieldHandler,
  deleteCustomFieldHandler,
  // likes and watchers handlers
  likeCardHandler,
  unlikeCardHandler,
  addWatcherToCardHandler,
  removeWatcherFromCardHandler,

  getSubTaskByIdHandler,
  getTimeLogByIdHandler,
  getCustomFieldByIdHandler,
  addLabelToCardHandler,
  removeLabelFromCardHandler,
  updateCardGanttHandler,
  fetchCardsByBoardIdHandler,
  fetchAllCardsByBoardIdHandler
} from '../../controllers/Task/cardController';
import { authenticateJWT } from '../../middlewares/authMiddleware';
import { authorizeCardAccess } from '../../middlewares/cardMiddleware';

const router = Router();

// Apply authentication middleware
router.use(authenticateJWT);

/**
 * @route   POST /api/cards
 * @desc    Create a new card
 * @access  Private
 */
router.post('/', createCardHandler);

/**
 * @route   GET /api/cards/:cardId
 * @desc    Get card details
 * @access  Private
 */
router.get('/:cardId', getCardHandler);

/**
 * @route   GET /api/cards/:boardId
 * @desc    Fetch all cards for a board
 * @access  Private
 * */
router.get('/boards/:boardId/cards', fetchCardsByBoardIdHandler);

router.get('/boards/:boardId/all', fetchAllCardsByBoardIdHandler);

/**
 * @route   PUT /api/cards/:cardId
 * @desc    Update card details
 * @access  Private
 */
router.put('/:cardId', authorizeCardAccess, updateCardHandler);

router.put('/:cardId/gantt',  updateCardGanttHandler);

router.get('/:cardId/subtasks/:subTaskId', getSubTaskByIdHandler);
router.get('/:cardId/timelogs/:timeLogId', getTimeLogByIdHandler);
router.get('/:cardId/customfields/:customFieldId', getCustomFieldByIdHandler);

/**
 * @route   DELETE /api/cards/:cardId
 * @desc    Delete a card
 * @access  Private
 */
router.delete('/:cardId', authorizeCardAccess, deleteCardHandler);

/**
 * @route   POST /api/cards/:cardId/assign
 * @desc    Assign a user to a card
 * @access  Private
 */
router.post('/:cardId/assign', authorizeCardAccess, assignUserToCardHandler);

// DELETE /api/cards/:cardId/unassign (or POST if you prefer)
router.delete('/:cardId/unassign', authorizeCardAccess, unassignUserFromCardHandler);

/* -----------------------------------------------------------
   SUB-TASK ROUTES
----------------------------------------------------------- */
/// src/routes/cardRoutes.ts

// POST /api/cards/:cardId/subtasks
router.post('/:cardId/subtasks', authorizeCardAccess, addSubTaskHandler);

// PUT /api/cards/:cardId/subtasks/:subTaskId
router.put('/:cardId/subtasks/:subTaskId', authorizeCardAccess, updateSubTaskHandler);

// DELETE /api/cards/:cardId/subtasks/:subTaskId
router.delete('/:cardId/subtasks/:subTaskId', authorizeCardAccess, deleteSubTaskHandler);


/* -----------------------------------------------------------
   TIME LOG ROUTES
----------------------------------------------------------- */

/**
 * @route   POST /api/cards/:cardId/timelogs
 * @desc    Log time
 */
router.post('/:cardId/timelogs', authorizeCardAccess, logTimeHandler);

/* -----------------------------------------------------------
   CUSTOM FIELD ROUTES
----------------------------------------------------------- */

/**
 * @route   POST /api/cards/:cardId/customfields
 * @desc    Add a custom field
 */
router.post('/:cardId/customfields', authorizeCardAccess, addCustomFieldHandler);

/**
 * @route   PUT /api/cards/:cardId/customfields/:fieldIndex
 * @desc    Update a custom field
 */
router.put('/:cardId/customfields/:fieldIndex', authorizeCardAccess, updateCustomFieldHandler);

/**
 * @route   DELETE /api/cards/:cardId/customfields/:fieldIndex
 * @desc    Delete a custom field
 */
router.delete('/:cardId/customfields/:fieldIndex', authorizeCardAccess, deleteCustomFieldHandler);

/* -----------------------------------------------------------
    LIKES AND WATCHERS ROUTES
----------------------------------------------------------- */

/**
 * @route   POST /api/cards/:cardId/like
 * @desc    Like a card
 * @access  Private
 */
router.post('/:cardId/like', authorizeCardAccess, likeCardHandler);

/**
 * @route   POST /api/cards/:cardId/unlike
 * @desc    Unlike a card
 * @access  Private
 */
router.post('/:cardId/unlike', authorizeCardAccess, unlikeCardHandler);

/**
 * @route   POST /api/cards/:cardId/watchers
 * @desc    Add a watcher to a card
 * @access  Private
 */
router.post('/:cardId/watchers', authorizeCardAccess, addWatcherToCardHandler);

/**
 * @route   DELETE /api/cards/:cardId/watchers
 * @desc    Remove a watcher from a card
 * @access  Private
 */
router.delete('/:cardId/watchers', authorizeCardAccess, removeWatcherFromCardHandler);


// Add Label to Card
router.post('/:cardId/labels', addLabelToCardHandler);

// Remove Label from Card
router.delete('/:cardId/labels', removeLabelFromCardHandler);

export default router;
