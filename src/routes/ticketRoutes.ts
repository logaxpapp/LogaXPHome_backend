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

// Get ticket by ID
router.get('/:id', ticketController.getTicketById);

//Get personal tickets (Users only)

router.get('/personal', authorizeRoles(UserRole.User), ticketController.getPersonalTickets);

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

router.post(
    '/:id/attachments',
    upload.single('attachment'), // Apply Multer middleware here
    ticketController.addAttachment
  );

export default router;
