// src/routes/authRoutes.ts

import { Router } from 'express';

import { 
 
  requestPasswordReset,
  resetPasswordHandler,
} from '../controllers/authController';


const router = Router();



// Add these new routes:
router.post('/request-password-reset', requestPasswordReset); // Public route
router.post('/reset-password', resetPasswordHandler);         // Public route



export default router;
