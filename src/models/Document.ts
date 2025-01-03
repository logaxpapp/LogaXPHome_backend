// src/models/Document.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

export enum DocumentVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface IDocument extends Document {
    _id: string; // or mongoose.Types.ObjectId
  title: string;
  description?: string;
  recipientUser?: mongoose.Types.ObjectId | IUser;  // if "sent to" a user in the system
  recipientEmail?: string;                          // if "sent to" an external email
  sentBy?: mongoose.Types.ObjectId | IUser;  
  uploader: mongoose.Types.ObjectId | IUser;
  key: string;            // S3 object key
  url: string;            // Full accessible URL
  visibility: DocumentVisibility;
  watchers: mongoose.Types.ObjectId[];
  tags: string[];        // new
  category?: string;     // new
  passwordProtected: boolean;   // new field
  encryptionKey?: string;       // storing the password/encryption key in plaintext (demo only!)

  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true },
    url: { type: String, required: true },
    visibility: {
      type: String,
      enum: Object.values(DocumentVisibility),
      default: DocumentVisibility.PRIVATE,
    },
    watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // NEW FIELDS
    recipientUser: { type: Schema.Types.ObjectId, ref: 'User' },
    recipientEmail: { type: String }, 
    sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
    passwordProtected: { type: Boolean, default: false },
    encryptionKey: { type: String },  tags: [{ type: String, trim: true }],       // array of strings
    category: { type: String, trim: true }, // single string
  },
  { timestamps: true }
);

const DocumentModel: Model<IDocument> = mongoose.model<IDocument>('Document', DocumentSchema);
export default DocumentModel;
