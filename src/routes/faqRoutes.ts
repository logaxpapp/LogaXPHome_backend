import { Router } from 'express';
import faqController from '../controllers/faqController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = Router();

// Public Route: Get all FAQs with optional filters and pagination
router.get('/', faqController.getFAQs);
router.get('/published', faqController.getPublishedFAQs); 

// Protected Routes: Require Authentication
router.use(authenticateJWT);

// Route to get a single FAQ by ID
router.get('/:id', faqController.getFAQById);

// Admin Only Routes
router.post('/', authorizeRoles(UserRole.Admin), faqController.createFAQ);
router.put('/:id', authorizeRoles(UserRole.Admin), faqController.updateFAQ);
router.put('/:id/publish', authorizeRoles(UserRole.Admin), faqController.publishFAQ); // Publish route
router.put('/:id/unpublish', authorizeRoles(UserRole.Admin), faqController.unpublishFAQ); // Unpublish route
router.delete('/:id', authorizeRoles(UserRole.Admin), faqController.deleteFAQ);

export default router;