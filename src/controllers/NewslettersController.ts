import { Request, Response, NextFunction } from 'express';
import NewslettersService from '../services/NewslettersService';
import NewsletterService from '../services/newsletterService';

class NewsletterController {
  static async createNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, content, image } = req.body;
      const newsletter = await NewslettersService.createNewsletter(subject, content, image);
      res.status(201).json(newsletter);
    } catch (error) {
      next(error);
    }
  }

    /**
   * Handle sending newsletters (Admin only).
   */
    static async sendNewsletter(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
          const { subject, content } = req.body;
    
          if (!subject || !content) {
            res.status(400).json({ message: 'Subject and content are required to send a newsletter.' });
            return;
          }
    
          await NewsletterService.sendNewsletter(subject, content);
    
          res.status(200).json({ message: 'Newsletter sent successfully to all confirmed subscribers.' });
        } catch (error: any) {
          next(error);
        }
      }

  static async getAllNewsletters(req: Request, res: Response, next: NextFunction) {
    try {
      const newsletters = await NewslettersService.getAllNewsletters();
      res.status(200).json(newsletters);
    } catch (error) {
      next(error);
    }
  }

  static async updateNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const newsletter = await NewslettersService.updateNewsletter(id, updates);
      res.status(200).json(newsletter);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await NewslettersService.deleteNewsletter(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default NewsletterController;
