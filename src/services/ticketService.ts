// src/services/ticketService.ts

import Ticket, { ITicket } from '../models/Ticket';
import { IUser } from '../models/User';
import { TicketStatus } from '../types/ticketTypes';

class TicketService {
  // Create a new ticket
  async createTicket(ticketData: Partial<ITicket>, user: IUser): Promise<ITicket> {
    const ticket = new Ticket({
      ...ticketData,
      createdBy: user._id,
      activityLog: [
        {
          action: 'Ticket created',
          performedBy: user._id,
          date: new Date(),
        },
      ],
    });
    return ticket.save();
  }

  // Get all tickets with optional filters
  async getTickets(
    filters: any = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<{ tickets: ITicket[]; total: number }> {
    const tickets = await Ticket.find(filters)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .sort(options.sort || { date: -1 });

    const total = await Ticket.countDocuments(filters);

    return { tickets, total };
  }

  // Get ticket by ID
  async getTicketById(ticketId: string): Promise<ITicket | null> {
    return Ticket.findById(ticketId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name email');
  }

  // Update a ticket
  async updateTicket(
    ticketId: string,
    updateData: Partial<ITicket>,
    user: IUser
  ): Promise<ITicket | null> {
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        ...updateData,
        updatedBy: user._id,
        $push: {
          activityLog: {
            action: 'Ticket updated',
            performedBy: user._id,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
    return ticket;
  }

  // Delete a ticket
  async deleteTicket(ticketId: string): Promise<ITicket | null> {
    return Ticket.findByIdAndDelete(ticketId);
  }

  // Add a comment to a ticket
  async addComment(
    ticketId: string,
    commentContent: string,
    user: IUser
  ): Promise<ITicket | null> {
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        $push: {
          comments: {
            author: user._id,
            content: commentContent,
            date: new Date(),
          },
          activityLog: {
            action: 'Comment added',
            performedBy: user._id,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
    return ticket;
  }

  // Assign a ticket
  async assignTicket(
    ticketId: string,
    assigneeId: string,
    user: IUser
  ): Promise<ITicket | null> {
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        assignedTo: assigneeId,
        $push: {
          activityLog: {
            action: 'Ticket assigned',
            performedBy: user._id,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
    return ticket;
  }

   // Get personal tickets
   async getPersonalTickets(
    userId: string,
    filters: any = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<{ tickets: ITicket[]; total: number }> {
    const personalFilters = {
      ...filters,
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    };

    const tickets = await Ticket.find(personalFilters)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name email')
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .sort(options.sort || { date: -1 });

    const total = await Ticket.countDocuments(personalFilters);

    return { tickets, total };
  }

  // Update ticket status
  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    user: IUser
  ): Promise<ITicket | null> {
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        status,
        $push: {
          activityLog: {
            action: `Status updated to ${status}`,
            performedBy: user._id,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
    return ticket;
  }

  // Add an attachment
  async addAttachment(
    ticketId: string,
    attachmentData: { filename: string; url: string },
    user: IUser
  ): Promise<ITicket | null> {
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        $push: {
          attachments: {
            filename: attachmentData.filename,
            url: attachmentData.url,
            uploadedAt: new Date(),
          },
          activityLog: {
            action: 'Attachment added',
            performedBy: user._id,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
    return ticket;
  }
}

export default new TicketService();
