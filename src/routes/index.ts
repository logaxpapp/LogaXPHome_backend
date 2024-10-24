// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Mount Auth Routes
router.use('/auth', authRoutes);

// Mount Profile Routes
router.use('/profile', profileRoutes);

// Mount Admin Routes
router.use('/admin', adminRoutes);

// Mount User Routes
router.use('/users', userRoutes);

// Add more routes as needed

export default router;
