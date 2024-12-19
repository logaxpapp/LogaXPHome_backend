// src/routes/newsletterRoutes.ts

import { Router } from 'express';
import NewsletterController from '../controllers/newsletterController';
import { authenticateJWT,  } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { handleValidation } from '../middlewares/validationMiddleware';

const router = Router();

// Define rate limiter for subscription endpoint
const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many subscription attempts from this IP, please try again after 15 minutes.',
});

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe to the newsletter
 * @access  Public
 */
router.post(
  '/subscribe',
  subscribeLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),
  ],
  handleValidation,
  NewsletterController.subscribe
);

/**
 * @route   GET /api/newsletter/confirm/:token
 * @desc    Confirm newsletter subscription
 * @access  Public
 */
router.get('/confirm/:token', NewsletterController.confirmSubscription);

/**
 * @route   Get /api/newsletter/subscription
  * @desc    Get all newsletter subscriptions
  * @access  Private (Admin)
  * */
router.get('/subscriptions', authenticateJWT, authorizeRoles(UserRole.Admin), NewsletterController.getAllSubscriptions);

/**
 * @route   GET /api/newsletter/unsubscribe/:token
 * @desc    Unsubscribe from the newsletter
 * @access  Public
 */
router.get('/unsubscribe/:token', NewsletterController.unsubscribe);

/**
 * @route   POST /api/newsletter/send
 * @desc    Send a newsletter to all confirmed subscribers
 * @access  Private (Admin)
 */
router.post(
  '/send',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  [
    body('subject')
      .notEmpty()
      .withMessage('Subject is required.')
      .isString()
      .withMessage('Subject must be a string.'),
    body('content')
      .notEmpty()
      .withMessage('Content is required.')
      .isString()
      .withMessage('Content must be a string.'),
  ],
  handleValidation,
  NewsletterController.sendNewsletter
);

/**
 * @route   DELETE /api/newsletter/subscriptions/:id
 * @desc    Delete a subscription
 * @access  Private (Admin)
 */
router.delete(
  '/subscriptions/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  NewsletterController.deleteSubscription
);

/**
 * @route   PATCH /api/newsletter/subscriptions/:id/suspend
 * @desc    Suspend a subscription
 * @access  Private (Admin)
 */
router.patch(
  '/subscriptions/:id/suspend',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  NewsletterController.suspendSubscription
);

// src/routes/newsletterRoutes.ts
router.patch(
  '/subscriptions/:id/confirm',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  NewsletterController.confirmSubscriptionById
);



export default router;
