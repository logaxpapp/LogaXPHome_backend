// src/routes/userRoutes.ts
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import {
  getAllUsersHandler,
  changeUserRoleHandler,
  resetUserPasswordHandler,
  editUserProfileHandler,
  fetchEmployees,
  

} from '../controllers/adminController';
import { register } from '../controllers/authController';
import { getUserByIdHandler } from '../controllers/profileController';
import { authenticateJWT } from '../middlewares/authMiddleware';


const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticateJWT);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/employees', fetchEmployees);
router.get('/', getAllUsersHandler);
// Get user by ID
router.get('/details/:id', getUserByIdHandler);
router.get('/:id', editUserProfileHandler);
router.put('/:id', resetUserPasswordHandler);

router.post('/', register);


/**
 * @route   PUT /api/users/:id/change-role
 * @desc    Change user role
 * @access  Private (Admin)
 */



export default router;
