import { Router } from 'express';
import {
  createWhiteboardController,
  getWhiteboardController,
  updateWhiteboardController,
  addParticipantController,
  removeParticipantController,
  revertToSnapshotController,
  deleteWhiteboardController,
  getMyWhiteboardsController,
  deleteSnapshotController,
  editWhiteboardController,
    getBoardSnapshotsController,
    getBoardParticipantsController,
} from '../controllers/whiteboardController';
 import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Middleware for authentication

router.use(authenticateJWT);

router.post('/', createWhiteboardController);         // Create
router.get('/mine', getMyWhiteboardsController);      // List current user's boards
router.get('/:id', getWhiteboardController);          // Get one
router.put('/:id', updateWhiteboardController);       // Update strokes, snapshots, etc.
router.patch('/:id', editWhiteboardController);       // ✨ Edit metadata (title, desc)
router.post('/:id/participants', addParticipantController);
router.delete('/:id/participants', removeParticipantController);
router.put('/:id/revert', revertToSnapshotController);
router.delete('/:id', deleteWhiteboardController);
router.delete('/:id/snapshots/:snapshotId', deleteSnapshotController);
router.get('/:id/snapshots', getBoardSnapshotsController);
router.get('/:id/participants', getBoardParticipantsController);

export default router;