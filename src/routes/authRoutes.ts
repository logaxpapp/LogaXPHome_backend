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
  requestPasswordReset,
  resetPasswordHandler,
  getResetPassword,
} from '../controllers/authController';
import { UserRole } from '../types/enums';

const router = Router();

// Existing public routes
router.post('/register', register);
router.get('/verify-email', verifyEmailHandler);
router.post('/login', login);

// Add these new routes:
router.get('/reset-password', getResetPassword);
router.post('/request-password-reset', requestPasswordReset); // Public route
router.post('/reset-password', resetPasswordHandler);         // Public route

// Protected or other routes
router.get('/logout', authenticateJWT, logout);
router.get('/setup-account', getSetupAccount);
router.post('/setup-account', setupAccount);
router.get('/all-logged-in-users', authenticateJWT, getAllLoggedInUsers);
router.put('/change-password', authenticateJWT, changePasswordHandler);
router.post(
  '/admin/logout/:userId',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  adminLogoutUser
);

export default router;
