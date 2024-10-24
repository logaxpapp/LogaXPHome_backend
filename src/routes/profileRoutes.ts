// src/routes/profileRoutes.ts
import { Router } from 'express';
import {
  viewProfile,
  editProfile,
  changePassword,
  deleteAccountRequest,
} from '../controllers/profileController';
import { body } from 'express-validator';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Apply authentication middleware to all profile routes
router.use(authenticateJWT);

// GET /api/profile
router.get('/', viewProfile);

// PUT /api/profile
router.put(
  '/',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('job_title').optional().notEmpty().withMessage('Job title cannot be empty'),
    body('applications_managed').optional().isArray().withMessage('Applications managed must be an array'),
  ],
  editProfile
);

// PUT /api/profile/password
router.put(
  '/password',
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  changePassword
);

// DELETE /api/profile
router.delete('/', deleteAccountRequest);

export default router;
