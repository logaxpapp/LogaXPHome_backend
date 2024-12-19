// src/types/Newsletter.ts

export interface SubscribeRequest {
    email: string;
  }
  
  export interface SendNewsletterRequest {
    subject: string;
    content: string;
  }
  