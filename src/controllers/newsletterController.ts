// src/controllers/newsletterController.ts

import { Request, Response, NextFunction } from 'express';
import NewsletterService from '../services/newsletterService';

class NewsletterController {
  /**
   * Handle newsletter subscription.
   */
  static async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: 'Email is required.' });
        return;
      }

      const subscription = await NewsletterService.subscribe(email);

      res.status(201).json({
        message: 'Subscription successful. Please check your email to confirm.',
        subscription: {
          email: subscription.email,
          subscribedAt: subscription.subscribedAt,
        },
      });
    } catch (error: any) {
      if (error.message === 'This email is already subscribed.') {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  static async getAllSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;

      const subscriptions = await NewsletterService.getAllSubscriptions(Number(page), Number(limit));
      
      res.status(200).json({
        message: 'Subscriptions fetched successfully.',
        ...subscriptions, // includes data, total, page, and limit
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handle subscription confirmation.
   */
  static async confirmSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({ message: 'Confirmation token is required.' });
        return;
      }

      const subscription = await NewsletterService.confirmSubscription(token);

      res.status(200).json({
        message: 'Subscription confirmed successfully.',
        subscription: {
          email: subscription.email,
          subscribedAt: subscription.subscribedAt,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * Handle unsubscription.
   */
  static async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({ message: 'Unsubscribe token is required.' });
        return;
      }

      const subscription = await NewsletterService.unsubscribe(token);

      res.status(200).json({
        message: 'Successfully unsubscribed from the newsletter.',
        subscription: {
          email: subscription.email,
          unsubscribedAt: subscription.unsubscribedAt,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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

   /**
   * Handle deleting a subscription.
   */
   static async deleteSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'Subscription ID is required.' });
        return;
      }

      await NewsletterService.deleteSubscription(id);
      res.status(200).json({ message: 'Subscription deleted successfully.' });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handle suspending a subscription.
   */
  static async suspendSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: 'Subscription ID is required.' });
        return;
      }

      const updatedSubscription = await NewsletterService.suspendSubscription(id);
      res.status(200).json({
        message: 'Subscription suspended successfully.',
        subscription: updatedSubscription,
      });
    } catch (error: any) {
      next(error);
    }
  }

  // src/controllers/newsletterController.ts
static async confirmSubscriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'Subscription ID is required.' });
      return;
    }

    const updatedSubscription = await NewsletterService.confirmSubscriptionById(id);
    res.status(200).json({
      message: 'Subscription confirmed successfully.',
      subscription: updatedSubscription,
    });
  } catch (error: any) {
    next(error);
  }
}

}

export default NewsletterController;
