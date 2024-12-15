import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { getGroupConversation } from '../controllers/groupMessageController';

const router = express.Router();

// Get group conversation messages
router.get('/:groupId/messages', authenticateJWT, getGroupConversation);

export default router;
