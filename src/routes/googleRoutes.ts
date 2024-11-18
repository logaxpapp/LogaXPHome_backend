// src/routes/GoogleRoutes.ts
import { Router } from 'express';
import * as GoogleController from '../controllers/googleController'; // Ensure correct case
import { authenticateJWT } from '../middlewares/authMiddleware'; // Ensure authentication middleware is applied

const router = Router();

router.get('/auth/callback', GoogleController.handleGoogleAuthCallback);

// Apply Authentication Middleware if needed
router.use(authenticateJWT);

// OAuth Routes
router.post('/auth', GoogleController.initiateGoogleAuth);


// Calendar Event Routes
router.post('/calendar/events', GoogleController.createEvent);
router.get('/calendar/events', GoogleController.listEvents);
router.delete('/calendar/events/:eventId', GoogleController.deleteEvent);

// Disconnect Google Account
router.post('/disconnect', GoogleController.disconnectGoogleAccount);

export default router;
