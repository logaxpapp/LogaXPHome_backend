import { Router } from 'express';
import NewsletterController from '../controllers/NewslettersController';
import { authenticateJWT, } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  NewsletterController.getAllNewsletters
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  NewsletterController.createNewsletter
);

router.post(
    '/send',
    authenticateJWT,
    authorizeRoles(UserRole.Admin),
    NewsletterController.sendNewsletter
  );

router.patch(
  '//:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  NewsletterController.updateNewsletter
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.Admin),
  NewsletterController.deleteNewsletter
);

export default router;
