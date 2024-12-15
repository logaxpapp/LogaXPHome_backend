// src/routes/messageRoutes.ts

import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import {
  getConversation,
  sendMessage,
  markAsRead,
  handleAddReaction,
  handleEditMessage,
  handleDeleteMessage,
  handleSearchMessages,
  updateOnlineStatus, 
  retrieveOnlineStatus
} from '../controllers/messageController';

const router = express.Router();

// 1. Get conversation between authenticated user and another participant
router.get('/conversations/:participantId', authenticateJWT, getConversation);

// 2. Send a private message
router.post('/send', authenticateJWT, sendMessage);

// 3. Send a group message
router.post('/send/group', authenticateJWT, sendMessage);

// 4. Mark messages as read
router.put('/conversations/:participantId/read', authenticateJWT, markAsRead);

// 5. Add a reaction to a message
router.post('/reactions', authenticateJWT, handleAddReaction);

// 6. Edit a message
router.put('/messages/:messageId/edit', authenticateJWT, handleEditMessage);

// 7. Delete a message
router.delete('/messages/:messageId/delete', authenticateJWT, handleDeleteMessage);

// 8. Search messages
router.get('/search', authenticateJWT, handleSearchMessages);

// 9. Update online status

router.put('/online/:userId', authenticateJWT, updateOnlineStatus);

// 10. Retrieve online status
router.get('/online/:userId', authenticateJWT, retrieveOnlineStatus);

export default router;
