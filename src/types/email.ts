// src/types/email.ts

/**
 * Interface representing the options for sending an email.
 */
export interface EmailOptions {
    to: string;           // Recipient's email address
    subject: string;      // Subject of the email
    text: string;         // Plain text content
    html?: string;        // HTML content (optional)
  }
  