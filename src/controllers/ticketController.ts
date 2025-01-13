// src/controllers/ticketController.ts

import { Request, Response } from 'express';
import ticketService from '../services/ticketService';
import { IUser } from '../models/User';
import { TicketStatus } from '../models/Ticket';

class TicketController {
  // Create a new ticket
  async createTicket(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const ticket = await ticketService.createTicket(req.body, user);
      res.status(201).json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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

   // Add a watcher to a ticket
   async addTicketWatcher(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { userId } = req.body; // The user to add as a watcher
      const ticket = await ticketService.addWatcher(req.params.id, userId, user);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json(ticket);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Remove a watcher from a ticket
  async removeTicketWatcher(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { userId } = req.params; // The user to remove as a watcher
      const ticket = await ticketService.removeWatcher(req.params.id, userId, user);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json(ticket);
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Update custom fields on a ticket
  async updateTicketCustomFields(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const fields = req.body.fields || {};
      const ticket = await ticketService.updateCustomFields(req.params.id, fields, user);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      res.status(200).json(ticket);
      return;
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Advanced ticket querying
  async getTicketsAdvanced(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        priority: req.query.priority as string,
        department: req.query.department as string,
        skip: parseInt(req.query.skip as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        // Add date filters if desired
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        dueStartDate: req.query.dueStartDate ? new Date(req.query.dueStartDate as string) : undefined,
        dueEndDate: req.query.dueEndDate ? new Date(req.query.dueEndDate as string) : undefined,
      };

      const result = await ticketService.getTicketsAdvanced(filters);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getTicketWatchers(req: Request, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.getTicketWatchers(req.params.id);
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }
      // ticket.watchers should be an array of user references
      res.status(200).json({ watchers: ticket.watchers });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async addWatcherToMultipleTickets(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { ticketIds, userId } = req.body; // { ticketIds: string[], userId: string }
  
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        res.status(400).json({ message: 'ticketIds must be a non-empty array' });
        return;
      }
  
      const results = [];
      for (const tid of ticketIds) {
        const updatedTicket = await ticketService.addWatcher(tid, userId, user);
        if (!updatedTicket) {
          // Could handle errors per-ticket or skip
          results.push({ ticketId: tid, status: 'Ticket not found or error' });
        } else {
          results.push({ ticketId: tid, status: 'Watcher added' });
        }
      }
  
      res.status(200).json({ results });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getCreatedTickets(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
  
      if (!user._id) {
        res.status(400).json({ message: 'User ID is missing' });
        return;
      }
  
      const filters: any = { createdBy: user._id }; // Fetch tickets created by the logged-in user
  
      // Optional: Add additional filters from query params
      if (req.query.status) {
        filters.status = req.query.status;
      }
  
      const options = {
        skip: parseInt(req.query.skip as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        sort: req.query.sort || { date: -1 },
      };
  
      const result = await ticketService.getTickets(filters, options);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  async getAssignedTickets(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
  
      if (!user._id) {
        res.status(400).json({ message: 'User ID is missing' });
        return;
      }
  
      const filters: any = { assignedTo: user._id }; // Fetch tickets assigned to the logged-in user
  
      // Optional: Add additional filters from query params
      if (req.query.status) {
        filters.status = req.query.status;
      }
  
      const options = {
        skip: parseInt(req.query.skip as string) || 0,
        limit: parseInt(req.query.limit as string) || 10,
        sort: req.query.sort || { date: -1 },
      };
  
      const result = await ticketService.getTickets(filters, options);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
    // Get tickets by status
async getTicketsByStatus(req: Request, res: Response) {
  try {
    const user = req.user as IUser;
    const { status } = req.params;
    const { skip = 0, limit = 10 } = req.query;

    const filters = {
      createdBy: user._id,
      status,
    };

    const options = {
      skip: parseInt(skip as string),
      limit: parseInt(limit as string),
      sort: { date: -1 },
    };

    const result = await ticketService.getTickets(filters, options);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

}

export default new TicketController();
