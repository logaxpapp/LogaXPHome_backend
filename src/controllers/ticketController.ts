// src/controllers/ticketController.ts

import { Request, Response } from 'express';
import ticketService from '../services/ticketService';
import { IUser } from '../models/User';
import { TicketStatus } from '../models/Ticket';

class TicketController {
  // Create a new ticket
  async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const ticket = await ticketService.createTicket(req.body, user);
      res.status(201).json(ticket);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ message: err.message });
    }
  }

  // Get all tickets
  async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const filters = {}; // Build filters from query params if needed
      const options = {
        skip: parseInt(req.query.skip as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        sort: req.query.sort || { date: -1 },
      };
      const result = await ticketService.getTickets(filters, options);
      res.status(200).json(result);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ message: err.message });;
    }
  }

  // Get ticket by ID
  async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json(ticket);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ message: err.message });
    }
  }

  // Update a ticket
  async updateTicket(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const ticket = await ticketService.updateTicket(req.params.id, req.body, user);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json(ticket);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ message: err.message });
    }
  }

  // Delete a ticket
  async deleteTicket(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.deleteTicket(req.params.id);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ message: err.message });
    }
  }

  // Add a comment
  async addComment(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const ticket = await ticketService.addComment(req.params.id, req.body.content, user);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(201).json(ticket);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ message: err.message });
    }
  }

  // Assign a ticket
  async assignTicket(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const { assigneeId } = req.body;
      const ticket = await ticketService.assignTicket(req.params.id, assigneeId, user);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json(ticket);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ message: err.message });
    }
  }

  // Update ticket status
  async updateTicketStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const { status } = req.body;
      const ticket = await ticketService.updateTicketStatus(
        req.params.id,
        status as TicketStatus,
        user
      );
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json(ticket);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ message: err.message });
    }
  }

  // Get personal tickets

  async getPersonalTickets(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;

      if (!user._id) {
        res.status(400).json({ message: 'User ID is missing' });
        return;
      }

      const userId = user._id.toString(); // Ensure _id is treated as a string

      const filters: any = {};

      // Optional: Build filters from query params
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.priority) {
        filters.priority = req.query.priority;
      }
      // Add more filters as needed

      const options = {
        skip: parseInt(req.query.skip as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        sort: req.query.sort || { date: -1 },
      };

      const result = await ticketService.getPersonalTickets(userId, filters, options);
      res.status(200).json(result);
    } catch (error) {
      const err = error as Error;
      res.status(400).json({ message: err.message });
    }
  }


  // Add an attachment
  async addAttachment(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;

      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const attachmentData = {
        filename: req.file.filename,
        url: req.file.path, // Adjust based on your storage solution
      };

      const ticket = await ticketService.addAttachment(
        req.params.id,
        attachmentData,
        user
      );

      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }

      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unexpected error occurred' });
      }
    }
  }
}

export default new TicketController();
