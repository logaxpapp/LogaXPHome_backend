// src/routes/authRoutes.ts

import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { 
  register, 
  verifyEmailHandler, 
  login, 
  getSetupAccount, 
  setupAccount, 
  getAllLoggedInUsers,
  logout,
  changePasswordHandler,
  adminLogoutUser,
} from '../controllers/authController';
import { UserRole } from '../types/enums';

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
router.post('/admin/logout/:userId', authenticateJWT, authorizeRoles(UserRole.Admin), adminLogoutUser);

export default router;
