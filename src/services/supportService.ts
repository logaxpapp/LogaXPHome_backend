import { SupportTicket, ITicket, FAQ, IFAQ } from '../models/Support';
import mongoose from 'mongoose';

// === GENERATE TICKET NUMBER ===
// Function to generate a unique ticket number
const generateUniqueTicketNumber = async (): Promise<string> => {
    let ticketNumber: string;
    let isUnique = false;
  
    do {
      // Generate a ticket number in the format "LogaXP-****" (e.g., LogaXP-1234)
      ticketNumber = `LogaXP-${Math.floor(1000 + Math.random() * 9000)}`; // Random 4-digit number
  
      // Check if the ticketNumber already exists in the database
      const existingTicket = await SupportTicket.findOne({ ticketNumber });
      isUnique = !existingTicket;
    } while (!isUnique);
  
    return ticketNumber;
  };
  

// === TICKET SERVICES ===

// Create a new support ticket
export const createSupportTicket = async (
    userId: mongoose.Types.ObjectId,
    subject: string,
    description: string,
    priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium',
    tags: string[] = []
  ): Promise<ITicket> => {
    // Generate a unique ticket number
    const ticketNumber = await generateUniqueTicketNumber();
  
    const ticket = new SupportTicket({
      userId,
      subject,
      description,
      priority,
      tags,
      ticketNumber, // Assign the generated ticket number
    });
  
    return await ticket.save();
  };
  

// Get all support tickets for a specific user
export const getSupportTicketsByUser = async (
  userId: mongoose.Types.ObjectId
): Promise<ITicket[]> => {
  return await SupportTicket.find({ userId }).sort({ createdAt: -1 });
};

export const getSupportTicketById = async (
    ticketId: mongoose.Types.ObjectId
  ): Promise<ITicket | null> => {
    try {
      return await SupportTicket.findById(ticketId)
        .populate('userId', 'name email') // Populate user information
        .exec(); // Ensure the query executes
    } catch (error) {
      console.error('Error fetching ticket from DB:', error);
      throw error; // Re-throw the error for higher-level handling
    }
  };
  

// Update a support ticket's status
export const updateSupportTicketStatus = async (
  ticketId: mongoose.Types.ObjectId,
  status: 'Open' | 'Resolved' | 'Pending' | 'Closed'
): Promise<ITicket | null> => {
  return await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true });
};

// Update tags and priority for a ticket
export const updateSupportTicketDetails = async (
  ticketId: mongoose.Types.ObjectId,
  updates: Partial<Pick<ITicket, 'tags' | 'priority'>>
): Promise<ITicket | null> => {
  return await SupportTicket.findByIdAndUpdate(ticketId, updates, { new: true });
};

// Delete a support ticket
export const deleteSupportTicket = async (
  ticketId: mongoose.Types.ObjectId
): Promise<ITicket | null> => {
  return await SupportTicket.findByIdAndDelete(ticketId);
};

// === FAQ SERVICES ===

// Create a new FAQ
export const createFAQ = async (question: string, answer: string): Promise<IFAQ> => {
  const faq = new FAQ({ question, answer });
  return await faq.save();
};

// Get all FAQs
export const getAllFAQs = async (): Promise<IFAQ[]> => {
  return await FAQ.find({});
};

// Update an FAQ
export const updateFAQ = async (
  faqId: mongoose.Types.ObjectId,
  updates: Partial<Pick<IFAQ, 'question' | 'answer'>>
): Promise<IFAQ | null> => {
  return await FAQ.findByIdAndUpdate(faqId, updates, { new: true });
};

// Delete an FAQ
export const deleteFAQ = async (faqId: mongoose.Types.ObjectId): Promise<IFAQ | null> => {
  return await FAQ.findByIdAndDelete(faqId);
};


export const updateSupportTicketStatusByAdmin = async (
    ticketId: mongoose.Types.ObjectId,
    status: 'Open' | 'Resolved' | 'Pending' | 'Closed'
  ): Promise<ITicket | null> => {
    return await SupportTicket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    );
  };
  