// src/models/NewsletterSubscription.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import validator from 'validator';

// Enum for subscription status
export enum SubscriptionStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Unsubscribed = 'Unsubscribed',
  
}

export interface INewsletterSubscription extends Document {
  email: string;
  subscribedAt: Date;
  status: SubscriptionStatus;
  confirmationToken?: string; // For email confirmation
  unsubscribeToken?: string; // For secure unsubscription
  unsubscribedAt?: Date;
}

const NewsletterSubscriptionSchema: Schema<INewsletterSubscription> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.Pending,
    },
    confirmationToken: {
      type: String,
    },
    unsubscribeToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const NewsletterSubscription: Model<INewsletterSubscription> = mongoose.model<
  INewsletterSubscription
>('NewsletterSubscription', NewsletterSubscriptionSchema);

export default NewsletterSubscription;
