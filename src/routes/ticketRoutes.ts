// src/routes/ticketRoutes.ts

import { Router } from 'express';
import ticketController from '../controllers/ticketController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { UserRole } from '../types/enums';
import upload from '../utils/multerConfig';

const router = Router();

// Apply authentication middleware
router.use(authenticateJWT);

// Create a new ticket
router.post('/', ticketController.createTicket);

// Get all tickets
router.get('/', ticketController.getTickets);

// Advanced querying
router.get('/advanced', ticketController.getTicketsAdvanced);

router.get('/:id/watchers', ticketController.getTicketWatchers);

// Get personal tickets (Users only)
router.get('/personal', ticketController.getPersonalTickets);

// Get ticket by ID
router.get('/:id', ticketController.getTicketById);

// Update ticket
router.put('/:id', ticketController.updateTicket);

// Delete ticket (Admins and Support only)
router.delete(
  '/:id',
  authorizeRoles(UserRole.Admin, UserRole.Support),
  ticketController.deleteTicket
);

// Add a comment
router.post('/:id/comments', ticketController.addComment);

// Assign a ticket (Admins and Support only)
router.put(
  '/:id/assign',
  authorizeRoles(UserRole.Admin, UserRole.Support),
  ticketController.assignTicket
);

// Update ticket status
router.put('/:id/status', ticketController.updateTicketStatus);

// Add an attachment
router.post(
  '/:id/attachments',
  upload.single('attachment'),
  ticketController.addAttachment
);

// Add a watcher (Admins and Support only)
router.post(
  '/:id/watchers',
  authorizeRoles(UserRole.Admin, UserRole.Support),
  ticketController.addTicketWatcher
);

router.post('/watchers', ticketController.addWatcherToMultipleTickets);

// Remove a watcher (Admins and Support only)
router.delete(
  '/:id/watchers/:userId',
  authorizeRoles(UserRole.Admin, UserRole.Support),
  ticketController.removeTicketWatcher
);

// Update custom fields (Admins and Support only)
router.patch(
  '/:id/custom-fields',
  authorizeRoles(UserRole.Admin, UserRole.Support),
  ticketController.updateTicketCustomFields
);

export default router;
