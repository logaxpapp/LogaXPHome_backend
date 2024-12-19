import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INewsletter extends Document {
  subject: string;
  content: string;
  image?: string;
  sentAt: Date;
}

const NewsletterSchema: Schema<INewsletter> = new Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Newsletter: Model<INewsletter> = mongoose.model<INewsletter>('Newsletter', NewsletterSchema);

export default Newsletter;
