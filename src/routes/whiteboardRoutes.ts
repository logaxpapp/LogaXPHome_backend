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
  deleteSnapshotController
} from '../controllers/whiteboardController';
 import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Middleware for authentication

router.use(authenticateJWT);

router.post('/',  createWhiteboardController);
 router.get('/mine', getMyWhiteboardsController);
router.get('/:id', getWhiteboardController);
router.put('/:id', updateWhiteboardController);
router.post('/:id/participants', addParticipantController);
router.delete('/:id/participants', removeParticipantController);
router.put('/:id/revert', revertToSnapshotController);
router.delete('/:id', deleteWhiteboardController);
router.delete('/:id/snapshots/:snapshotId', deleteSnapshotController);


export default router;
