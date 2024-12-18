// src/controllers/FAQController.ts

import { Request, Response } from 'express';
import faqService from '../services/faqService';
import { IUser } from '../models/User';
import mongoose from 'mongoose';
import { IFAQ } from '../models/FAQ';

class FAQController {
  async createFAQ(req: Request, res: Response) {
    try {
      console.log('Received FAQ Data:', req.body); // Log incoming data
      const user = req.user as IUser;
  
      const faq = await faqService.createFAQ(req.body, user._id);
      console.log('Final FAQ Payload:', faq); // Ensure all fields, including application, are present
      res.status(201).json({ message: 'FAQ created successfully', data: faq });
    } catch (error: any) {
      console.error('Error Creating FAQ:', error); // Log the error
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }
  

  async getFAQs(req: Request, res: Response) {
    try {
      const { application, page = '1', limit = '10' } = req.query;
      const parsedPage = parseInt(page as string, 10);
      const parsedLimit = parseInt(limit as string, 10);

      const faqs = await faqService.getFAQs(application as string);

      // Implement pagination manually or via service
      const startIndex = (parsedPage - 1) * parsedLimit;
      const endIndex = startIndex + parsedLimit;
      const paginatedFAQs = faqs.slice(startIndex, endIndex);

      res.status(200).json({
        data: paginatedFAQs,
        total: faqs.length,
        page: parsedPage,
        limit: parsedLimit,
      });
    } catch (error: any) {
      console.error('Error Getting FAQs:', error); // Log the error
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }

  async updateFAQ(req: Request, res: Response) {
    try {
      console.log('Received Update Data:', req.body); // Log incoming data
      const user = req.user as IUser;

      // Ensure user._id is a mongoose.Types.ObjectId
      if (!(user._id instanceof mongoose.Types.ObjectId)) {
        throw new Error('Invalid user ID format.');
      }

      const faqId = req.params.id;
      const updateData: Partial<IFAQ> = req.body;

      const updatedFAQ = await faqService.updateFAQ(faqId, updateData, user._id);
      if (!updatedFAQ) {
        res.status(404).json({ message: 'FAQ not found' });
        return;
      }

      res.status(200).json(updatedFAQ);
    } catch (error: any) {
      console.error('Error Updating FAQ:', error); // Log the error
      if (error.name === 'ValidationError') {
        res.status(400).json({ message: 'Validation Error', errors: error.errors });
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ message });
      }
    }
  }
  async getFAQById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validate the format of the ID (optional but recommended)
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({ message: 'Invalid FAQ ID format.' });
        return;
      }

      const faq = await faqService.getFAQById(id);
      if (!faq) {
        res.status(404).json({ message: 'FAQ not found.' });
        return;
      }
      res.status(200).json(faq);
    } catch (error: any) {
      console.error('Error Getting FAQ by ID:', error); // Log the error
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }

  async deleteFAQ(req: Request, res: Response) {
    try {
      const deletedFAQ = await faqService.deleteFAQ(req.params.id);
      if (!deletedFAQ) {
        res.status(404).json({ message: 'FAQ not found' });
        return;
      }
      res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (error: any) {
      console.error('Error Deleting FAQ:', error); // Log the error
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }
}

export default new FAQController();
