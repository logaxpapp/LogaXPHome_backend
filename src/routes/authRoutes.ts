// src/routes/authRoutes.ts

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { 
  register, 
  verifyEmailHandler, 
  login, 
  getSetupAccount, 
  setupAccount, 
  getAllLoggedInUsers,
  logout,
  changePasswordHandler,
} from '../controllers/authController';

const router = Router();

// Public routes
router.post('/register', register);
router.get('/verify-email', verifyEmailHandler);
router.post('/login', login);
router.get('/logout', authenticateJWT, logout);
router.get('/setup-account', getSetupAccount);
router.post('/setup-account', setupAccount);


// Protected route - only accessible by authenticated users
router.get('/all-logged-in-users', authenticateJWT, getAllLoggedInUsers);
router.put('/change-password', authenticateJWT, changePasswordHandler);


export default router;
