// src/routes/notificationRoutes.ts

import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController';

const router = express.Router();

// Get notifications for authenticated user
router.get('/', authenticateJWT, getUserNotifications);

// Mark a notification as read
router.put('/:notificationId/read', authenticateJWT, markNotificationRead);

// Mark all notifications as read
router.put('/read', authenticateJWT, markAllNotificationsRead);

export default router;
