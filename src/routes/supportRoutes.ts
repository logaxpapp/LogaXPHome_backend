import express from 'express';
import {
  createSupportTicketHandler,
  getUserTicketsHandler,
  getSupportTicketByIdHandler,
  updateSupportTicketStatusHandler,
  updateSupportTicketDetailsHandler,
  deleteSupportTicketHandler,
  createFAQHandler,
  getAllFAQsHandler,
  updateFAQHandler,
  deleteFAQHandler,
  updateTicketStatusByAdminHandler,
} from '../controllers/SupportController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';

const router = express.Router();

// === TICKET ROUTES ===

// User Routes

// POST /api/support/tickets - Create a support ticket (User)
router.post('/tickets', authenticateJWT, createSupportTicketHandler);

// GET /api/support/tickets - Get all tickets for the logged-in user (User)
router.get('/tickets', authenticateJWT, getUserTicketsHandler);

// GET /api/support/tickets/:ticketId - Get a specific ticket by ID (User)
router.get('/tickets/:ticketId', authenticateJWT, getSupportTicketByIdHandler);

// PUT /api/support/tickets/status - Update the status of a ticket (User/Admin depending on access level)
router.put('/tickets/status', authenticateJWT, updateSupportTicketStatusHandler);

// PUT /api/support/tickets/details - Update tags or priority of a ticket (User/Admin depending on access level)
router.put('/tickets/details', authenticateJWT, updateSupportTicketDetailsHandler);

// DELETE /api/support/tickets/:ticketId - Delete a ticket (User/Admin depending on ownership)
router.delete('/tickets/:ticketId', authenticateJWT, deleteSupportTicketHandler);

// === FAQ ROUTES ===

// Admin Routes

// POST /api/support/faqs - Create an FAQ (Admin only)
router.post(
  '/faqs',
  authenticateJWT,
  authorizeRoles(UserRole.Admin), // Only Admins can create FAQs
  createFAQHandler
);

// GET /api/support/faqs - Get all FAQs (Public)
router.get('/faqs', getAllFAQsHandler);

// PUT /api/support/faqs/:faqId - Update an FAQ (Admin only)
router.put(
  '/faqs/:faqId',
  authenticateJWT,
  authorizeRoles(UserRole.Admin), // Only Admins can update FAQs
  updateFAQHandler
);

// DELETE /api/support/faqs/:faqId - Delete an FAQ (Admin only)
router.delete(
  '/faqs/:faqId',
  authenticateJWT,
  authorizeRoles(UserRole.Admin), // Only Admins can delete FAQs
  deleteFAQHandler
);

// // Admin-only route for updating ticket status
router.patch('/admin/tickets/status', authorizeRoles(UserRole.Admin), updateTicketStatusByAdminHandler);

export default router;
