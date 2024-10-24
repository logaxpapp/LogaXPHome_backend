// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, verifyEmailHandler, login } from '../controllers/authController';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// GET /api/auth/register (Informational)
router.get('/register', (req, res) => {
  res.status(200).json({
    message: 'Register a new user by sending a POST request to this endpoint with the required fields.',
    requiredFields: {
      name: 'string',
      email: 'string',
      password: 'string',
      job_title: 'string',
      applications_managed: 'array of strings',
    },
  });
});

// GET /api/auth/verify-email
router.get('/verify-email', verifyEmailHandler);

// POST /api/auth/login
router.post('/login', login);

export default router;
