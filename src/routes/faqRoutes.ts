import { Router } from 'express';
import faqController from '../controllers/faqController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = Router();

// Public: Get FAQs
router.get('/', faqController.getFAQs);

// Protected: Admin Only
router.use(authenticateJWT);
router.post('/', authorizeRoles(UserRole.Admin), faqController.createFAQ);
router.put('/:id', authorizeRoles(UserRole.Admin), faqController.updateFAQ);
router.delete('/:id', authorizeRoles(UserRole.Admin), faqController.deleteFAQ);

export default router;
