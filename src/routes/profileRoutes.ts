// src/routes/profileRoutes.ts
import { Router } from 'express';
import {
  viewProfile,
  editProfile,
  changePassword,
  deleteAccountRequest,
  getUserByIdHandler,
} from '../controllers/profileController';
import { acknowledgeResourceHandler } from '../controllers/resourceController';
import { body } from 'express-validator';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// Apply authentication middleware to all profile routes
router.use(authenticateJWT);

// GET /api/profile
router.get('/', viewProfile);



// Acknowledge policy
router.post('/acknowledge-policy', acknowledgeResourceHandler);

// PUT /api/profile
router.put(
  '/:id',
  editProfile
);

// PUT /api/profile/password
router.put(
  '/password',
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validateRequest, // Add validation middleware
  changePassword
);

// DELETE /api/profile
router.delete('/', deleteAccountRequest);
// Account Deletion Requests


export default router;
