import { Request, Response } from 'express';
import faqService from '../services/faqService';
import { IUser } from '../models/User';

class FAQController {
  async createFAQ(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const faq = await faqService.createFAQ(req.body, user._id.toString());
      res.status(201).json(faq);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }

  async getFAQs(req: Request, res: Response) {
    try {
      const { application } = req.query;
      const faqs = await faqService.getFAQs(application as string);
      res.status(200).json(faqs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }

  async updateFAQ(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const updatedFAQ = await faqService.updateFAQ(req.params.id, req.body, user._id.toString());
      if (!updatedFAQ) res.status(404).json({ message: 'FAQ not found' });
      
      res.status(200).json(updatedFAQ);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }

  async deleteFAQ(req: Request, res: Response) {
    try {
      const deletedFAQ = await faqService.deleteFAQ(req.params.id);
      if (!deletedFAQ)  res.status(404).json({ message: 'FAQ not found' });
      res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  }
}

export default new FAQController();
