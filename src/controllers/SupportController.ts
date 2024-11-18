import { Request, Response, NextFunction } from 'express';
import {
  createSupportTicket,
  getSupportTicketsByUser,
  getSupportTicketById,
  updateSupportTicketStatus,
  updateSupportTicketDetails,
  deleteSupportTicket,
  createFAQ,
  getAllFAQs,
  updateFAQ,
  deleteFAQ,
  updateSupportTicketStatusByAdmin,
} from '../services/supportService';
import mongoose from 'mongoose';

// === TICKET CONTROLLERS ===

// Create a new support ticket
export const createSupportTicketHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }

    const { subject, description, priority, tags } = req.body;
    const userId = req.user._id;

    if (!subject || !description) {
      res.status(400).json({ message: 'Subject and description are required.' });
      return;
    }

    const ticket = await createSupportTicket(userId, subject, description, priority, tags);

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: {
        ...ticket.toObject(),
        ticketNumber: ticket.ticketNumber, // Return the unique ticket number
      },
    });
  } catch (error) {
    next(error);
  }
};

  
  // Get all support tickets for the current user
  export const getUserTicketsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        return;
      }
  
      const userId = req.user._id;
      const tickets = await getSupportTicketsByUser(userId);
      res.status(200).json(tickets);
    } catch (error) {
      next(error);
    }
  };

// Get a specific support ticket by ID
export const getSupportTicketByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.params;
    console.log('Fetching ticket with ID:', ticketId);

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      res.status(400).json({ message: 'Invalid Ticket ID format.' });
      return;
    }

    const ticket = await getSupportTicketById(new mongoose.Types.ObjectId(ticketId));
    if (!ticket) {
      console.log('Ticket not found:', ticketId);
      res.status(404).json({ message: 'Ticket not found.' });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error fetching ticket by ID:', error);
    next(error);
  }
};


// Update the status of a support ticket
export const updateSupportTicketStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, status } = req.body;

    if (!ticketId || !status) {
      res.status(400).json({ message: 'Ticket ID and status are required.' });
      return;
    }

    const updatedTicket = await updateSupportTicketStatus(new mongoose.Types.ObjectId(ticketId), status);
    if (!updatedTicket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    res.status(200).json({ message: 'Ticket status updated successfully', ticket: updatedTicket });
  } catch (error) {
    next(error);
  }
};

// Update tags or priority of a support ticket
export const updateSupportTicketDetailsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, tags, priority } = req.body;

    if (!ticketId) {
      res.status(400).json({ message: 'Ticket ID is required.' });
      return;
    }

    const updates = { tags, priority };
    const updatedTicket = await updateSupportTicketDetails(new mongoose.Types.ObjectId(ticketId), updates);
    if (!updatedTicket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    res.status(200).json({ message: 'Ticket updated successfully', ticket: updatedTicket });
  } catch (error) {
    next(error);
  }
};

// Delete a support ticket
export const deleteSupportTicketHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      res.status(400).json({ message: 'Ticket ID is required.' });
      return;
    }

    const deletedTicket = await deleteSupportTicket(new mongoose.Types.ObjectId(ticketId));
    if (!deletedTicket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    res.status(200).json({ message: 'Ticket deleted successfully', ticket: deletedTicket });
  } catch (error) {
    next(error);
  }
};

// === FAQ CONTROLLERS ===

// Create a new FAQ
export const createFAQHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      res.status(400).json({ message: 'Question and answer are required.' });
      return
    }

    const faq = await createFAQ(question, answer);
    res.status(201).json({ message: 'FAQ created successfully', faq });
  } catch (error) {
    next(error);
  }
};

// Get all FAQs
export const getAllFAQsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faqs = await getAllFAQs();
    res.status(200).json(faqs);
  } catch (error) {
    next(error);
  }
};

// Update an FAQ
export const updateFAQHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId, question, answer } = req.body;

    if (!faqId) {
      res.status(400).json({ message: 'FAQ ID is required.' });
      return;
    }

    const updates = { question, answer };
    const updatedFAQ = await updateFAQ(new mongoose.Types.ObjectId(faqId), updates);
    if (!updatedFAQ) {
      res.status(404).json({ message: 'FAQ not found' });
      return;
    }

    res.status(200).json({ message: 'FAQ updated successfully', faq: updatedFAQ });
  } catch (error) {
    next(error);
  }
};

// Delete an FAQ
export const deleteFAQHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { faqId } = req.params;

    if (!faqId) {
      res.status(400).json({ message: 'FAQ ID is required.' });
      return;
    }

    const deletedFAQ = await deleteFAQ(new mongoose.Types.ObjectId(faqId));
    if (!deletedFAQ) {
      res.status(404).json({ message: 'FAQ not found' });
      return;
    }

    res.status(200).json({ message: 'FAQ deleted successfully', faq: deletedFAQ });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatusByAdminHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, status } = req.body;

    if (!ticketId || !status) {
      res.status(400).json({ message: 'Ticket ID and status are required.' });
      return;
    }

    const updatedTicket = await updateSupportTicketStatusByAdmin(new mongoose.Types.ObjectId(ticketId), status);
    if (!updatedTicket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    res.status(200).json({ message: 'Ticket status updated successfully', ticket: updatedTicket });
  } catch (error) {
    next(error);
  }
};

