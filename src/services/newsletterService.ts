// src/services/newsletterService.ts

import NewsletterSubscription, {
    INewsletterSubscription,
    SubscriptionStatus,
  } from '../models/NewsletterSubscription';
  import Newsletter from '../models/Newsletter';
  import crypto from 'crypto';
  import { sendNewsletterEmail, sendConfirmationEmail, sendUnsubscribeConfirmationEmail } from '../utils/email';
  
  class NewsletterService {
    /**
     * Subscribe a new email to the newsletter.
     * @param email Subscriber's email address.
     * @returns The created subscription.
     */
    static async subscribe(email: string): Promise<INewsletterSubscription> {
      // Check if the email is already subscribed
      const existingSubscription = await NewsletterSubscription.findOne({ email });
  
      if (existingSubscription) {
        if (existingSubscription.status === SubscriptionStatus.Unsubscribed) {
          // Reactivate subscription
          existingSubscription.status = SubscriptionStatus.Pending;
          existingSubscription.confirmationToken = NewsletterService.generateToken();
          existingSubscription.unsubscribeToken = undefined;
          await existingSubscription.save();
  
          // Send confirmation email
          await sendConfirmationEmail(email, existingSubscription.confirmationToken!);
  
          return existingSubscription;
        } else {
          throw new Error('This email is already subscribed.');
        }
      }
  
      // Create a new subscription
      const confirmationToken = NewsletterService.generateToken();
      const unsubscribeToken = NewsletterService.generateToken();
  
      const subscription = await NewsletterSubscription.create({
        email,
        confirmationToken,
        unsubscribeToken,
      });
  
      // Send confirmation email
      await sendConfirmationEmail(email, confirmationToken);
  
      return subscription;
    }
  
    /**
     * Confirm a subscription using a token.
     * @param token Confirmation token from the email.
     * @returns The updated subscription.
     */
    static async confirmSubscription(token: string): Promise<INewsletterSubscription> {
      const subscription = await NewsletterSubscription.findOne({ confirmationToken: token });
  
      if (!subscription) {
        throw new Error('Invalid or expired confirmation token.');
      }
  
      subscription.status = SubscriptionStatus.Confirmed;
      subscription.confirmationToken = undefined;
      await subscription.save();
  
      return subscription;
    }
  
    /**
     * Unsubscribe an email from the newsletter using a token.
     * @param token Unsubscribe token from the email.
     * @returns The updated subscription.
     */
    static async unsubscribe(token: string): Promise<INewsletterSubscription> {
      const subscription = await NewsletterSubscription.findOne({ unsubscribeToken: token });
  
      if (!subscription) {
        throw new Error('Invalid or expired unsubscribe token.');
      }
  
      subscription.status = SubscriptionStatus.Unsubscribed;
      subscription.unsubscribeToken = undefined;
      await subscription.save();
  
      // Send unsubscription confirmation email
      await sendUnsubscribeConfirmationEmail(subscription.email);
  
      return subscription;
    }
  
    /**
     * Send a newsletter to all confirmed subscribers.
     * @param subject Subject of the newsletter.
     * @param content HTML or plain text content of the newsletter.
     */
    static async sendNewsletter(subject: string, content: string): Promise<void> {
      const confirmedSubscribers = await NewsletterSubscription.find({
        status: SubscriptionStatus.Confirmed,
      });
  
      if (confirmedSubscribers.length === 0) {
        console.log('No confirmed subscribers to send the newsletter.');
        return;
      }
  
      const emailPromises = confirmedSubscribers.map((subscriber) =>
        sendNewsletterEmail(subscriber.email, subject, content)
      );
  
      await Promise.all(emailPromises);
    }
  
    /**
     * Generate a secure random token.
     * @returns A hexadecimal token string.
     */
    private static generateToken(): string {
      return crypto.randomBytes(20).toString('hex');
    }

    /**
   * Fetch paginated newsletter subscriptions.
   * @param page Current page number.
   * @param limit Number of items per page.
   * @returns Paginated subscriptions.
   */
  static async getAllSubscriptions(page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      NewsletterSubscription.find().skip(skip).limit(limit),
      NewsletterSubscription.countDocuments(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Delete a subscription by ID.
   * @param id Subscription ID.
   */
  static async deleteSubscription(id: string): Promise<void> {
    const subscription = await NewsletterSubscription.findById(id);

    if (!subscription) {
      throw new Error('Subscription not found.');
    }

    await NewsletterSubscription.findByIdAndDelete(id);
  }

  /**
   * Suspend a subscription by ID.
   * @param id Subscription ID.
   * @returns The updated subscription.
   */
  static async suspendSubscription(id: string): Promise<INewsletterSubscription> {
    const subscription = await NewsletterSubscription.findById(id);

    if (!subscription) {
      throw new Error('Subscription not found.');
    }

    subscription.status = SubscriptionStatus.Unsubscribed;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    return subscription;
  }

  static async confirmSubscriptionById(id: string): Promise<INewsletterSubscription> {
    const subscription = await NewsletterSubscription.findById(id);
  
    if (!subscription) {
      throw new Error('Subscription not found.');
    }
  
    if (subscription.status === SubscriptionStatus.Confirmed) {
      throw new Error('Subscription is already confirmed.');
    }
  
    subscription.status = SubscriptionStatus.Confirmed;
    subscription.confirmationToken = undefined;
    await subscription.save();
  
    return subscription;
  }
}

  
  export default NewsletterService;
  