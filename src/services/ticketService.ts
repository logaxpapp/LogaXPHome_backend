// src/services/ticketService.ts

import Ticket, { ITicket } from '../models/Ticket';
import { IUser } from '../models/User';
import { createNotification } from './notificationService';
import { TicketStatus } from '../types/ticketTypes';
import mongoose from'mongoose';

interface TicketQueryOptions {
  search?: string;
  status?: string;
  priority?: string;
  department?: string;
  skip?: number;
  limit?: number;
  sort?: any;
  startDate?: Date;
  endDate?: Date;
  dueStartDate?: Date;
  dueEndDate?: Date;
}


class TicketService {
  // Create a new ticket
  async createTicket(ticketData: Partial<ITicket>, user?: IUser): Promise<ITicket> {
    // If no user was provided, we can fallback to `ticketData.createdBy` or handle differently
    const creatorId = user ? user._id : ticketData.createdBy;

    const ticket = new Ticket({
      ...ticketData,
      // Use creatorId if present
      createdBy: creatorId,

      // watchers includes the user if we have it, else none
      watchers: user ? [user._id] : [],
      
      activityLog: [
        {
          action: 'Ticket created',
          performedBy: creatorId,
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
      .limit(options.limit || 40)
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
    ).populate('watchers', '_id');

    if (ticket) {
      for (const watcherId of ticket.watchers as mongoose.Types.ObjectId[]) {
        await createNotification({
          type: 'TicketComment',
          recipient: watcherId,
          sender: user._id,
          data: { ticketId, comment: commentContent },
        });
      }
    }

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
      .limit(options.limit || 20)
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
    ).populate('watchers', '_id');

    if (ticket) {
      for (const watcherId of ticket.watchers as mongoose.Types.ObjectId[]) {
        await createNotification({
          type: 'TicketStatus',
          recipient: watcherId,
          sender: user._id,
          data: { ticketId, status },
        });
      }
    }

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
    ).populate('watchers', '_id');

    if (ticket) {
      for (const watcherId of ticket.watchers as mongoose.Types.ObjectId[]) {
        await createNotification({
          type: 'TicketAttachment',
          recipient: watcherId,
          sender: user._id,
          data: { ticketId, filename: attachmentData.filename },
        });
      }
    }

    return ticket;
  }

  async getTicketWatchers(ticketId: string): Promise<ITicket | null> {
    // Only fetch the watchers field from the ticket
    return Ticket.findById(ticketId, 'watchers')
      .populate('watchers', 'name email')
      .exec();
  }

  async getTicketsAdvanced(filters: TicketQueryOptions) {
    const pipeline: any[] = [];
    const matchConditions: any = {};

    if (filters.search) {
      matchConditions.$text = { $search: filters.search };
    }

    if (filters.status) {
      matchConditions.status = filters.status;
    }

    if (filters.priority) {
      matchConditions.priority = filters.priority;
    }

    if (filters.department) {
      matchConditions.department = filters.department;
    }

    if (filters.startDate || filters.endDate) {
      matchConditions.date = {};
      if (filters.startDate) matchConditions.date.$gte = filters.startDate;
      if (filters.endDate) matchConditions.date.$lte = filters.endDate;
    }

    if (filters.dueStartDate || filters.dueEndDate) {
      matchConditions.dueDate = {};
      if (filters.dueStartDate) matchConditions.dueDate.$gte = filters.dueStartDate;
      if (filters.dueEndDate) matchConditions.dueDate.$lte = filters.dueEndDate;
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    pipeline.push({ $sort: filters.sort || { date: -1 } });
    pipeline.push({ $skip: filters.skip || 0 });
    pipeline.push({ $limit: filters.limit || 10 });

    const tickets = await Ticket.aggregate(pipeline);
    const total = await Ticket.countDocuments(matchConditions);
    return { tickets, total };
  }

  async addWatcher(ticketId: string, userId: string, performedBy: IUser): Promise<ITicket | null> {
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $addToSet: { watchers: new mongoose.Types.ObjectId(userId) },
        $push: {
          activityLog: {
            action: 'Watcher added',
            performedBy: performedBy._id,
            date: new Date(),
          },
        },
      },
      { new: true }
    ).populate('watchers', '_id');

    if (updatedTicket) {
      // Notify the added watcher
      await createNotification({
        type: 'WatcherAdded',
        recipient: new mongoose.Types.ObjectId(userId),
        sender: performedBy._id,
        data: { ticketId: updatedTicket._id, title: updatedTicket.title },
      });
    }

    return updatedTicket;
  }

  async removeWatcher(ticketId: string, userId: string, performedBy: IUser): Promise<ITicket | null> {
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $pull: { watchers: new mongoose.Types.ObjectId(userId) },
        $push: {
          activityLog: {
            action: 'Watcher removed',
            performedBy: performedBy._id,
            date: new Date(),
          },
        },
      },
      { new: true }
    );

    if (updatedTicket) {
      // Optionally notify the removed watcher if desired
      await createNotification({
        type: 'WatcherRemoved',
        recipient: new mongoose.Types.ObjectId(userId),
        sender: performedBy._id,
        data: { ticketId: updatedTicket._id, title: updatedTicket.title },
      });
    }

    return updatedTicket;
  }

  async updateCustomFields(ticketId: string, fields: Record<string, any>, user: IUser): Promise<ITicket | null> {
    const updates: any = {};
    for (const [key, value] of Object.entries(fields)) {
      updates[`customFields.${key}`] = value;
    }

    updates.$push = {
      activityLog: {
        action: 'Custom fields updated',
        performedBy: user._id,
        date: new Date(),
      },
    };

    const ticket = await Ticket.findByIdAndUpdate(ticketId, updates, { new: true }).populate('watchers', '_id');

    if (ticket) {
      // Notify watchers of custom field update
      for (const watcherId of ticket.watchers as mongoose.Types.ObjectId[]) {
        await createNotification({
          type: 'CustomFieldsUpdated',
          recipient: watcherId,
          sender: user._id,
          data: { ticketId: ticketId, fields },
        });
      }
    }

    return ticket;
  }
  
}

export default new TicketService();
