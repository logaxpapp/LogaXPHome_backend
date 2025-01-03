// src/services/documentService.ts
import DocumentModel, { IDocument, DocumentVisibility } from '../models/Document';
import { IUser } from '../models/User';
import mongoose from 'mongoose';
import crypto from 'crypto';
import s3Client from '../utils/s3Client';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sendEmail } from '../utils/email'; // We'll reuse your email utility
import { EmailOptions } from '../types/email';



const s3BucketName = process.env.AWS_S3_BUCKET as string;

class DocumentService {
  /**
   * Upload a new document (metadata creation)
   */
  async createDocument(
    title: string,
    description: string,
    uploaderId: mongoose.Types.ObjectId,
    s3Key: string,
    s3Url: string,
    category: string,
    visibility: DocumentVisibility = DocumentVisibility.PRIVATE
  ): Promise<IDocument> {
    const newDoc = new DocumentModel({
      title,
      description,
      uploader: uploaderId,
      key: s3Key,
      url: s3Url,
      visibility,
      category,
      watchers: [uploaderId], // by default, the uploader is in watchers if it's PRIVATE
    });

    return newDoc.save();
  }

  /**
   * Get document by ID (optionally populate watchers, uploader)
   */
  async getDocumentById(docId: string): Promise<IDocument | null> {
    return DocumentModel.findById(docId)
      .populate('uploader', 'name email')
      .populate('watchers', 'name email');
  }

  /**
   * Get all documents (with optional filters for visibility, search, or user)
   */
  async getAllDocuments(
    filters: any = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<{ documents: IDocument[]; total: number }> {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;

    const docs = await DocumentModel.find(filters)
      .populate('uploader', 'name email')
      .populate('watchers', 'name email')
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .exec();

    const total = await DocumentModel.countDocuments(filters);
    return { documents: docs, total };
  }

  /**
   * Update document info (title, description, visibility)
   */
  async updateDocument(
    docId: string,
    updateData: Partial<IDocument>
  ): Promise<IDocument | null> {
    const updatedDoc = await DocumentModel.findByIdAndUpdate(
      docId,
      { $set: updateData },
      { new: true }
    )
      .populate('uploader', 'name email')
      .populate('watchers', 'name email');

    return updatedDoc;
  }

  /**
   * Delete a document (including from S3 if needed)
   */
  async deleteDocument(docId: string): Promise<IDocument | null> {
    // Optionally retrieve document first to remove from S3
    const doc = await DocumentModel.findById(docId);
    if (!doc) return null;

    // If needed, remove from S3
    // Example: use @aws-sdk/client-s3's DeleteObjectCommand
    // import { DeleteObjectCommand } from '@aws-sdk/client-s3';
    // await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: doc.key }));

    // Finally remove from DB
    const deletedDoc = await DocumentModel.findByIdAndDelete(docId);
    return deletedDoc;
  }

    /**
     * Check if user can view a PRIVATE document
     */
    async deleteDocumentS3Bucket(docId: string): Promise<IDocument | null> {
        const doc = await DocumentModel.findById(docId);
        if (!doc) return null;
      
        // Example: removing from S3
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: doc.key, // The key we stored in the DB
          })
        );
      
        const deletedDoc = await DocumentModel.findByIdAndDelete(docId);
        return deletedDoc;
      }

  /**
   * Add watcher to a PRIVATE document
   */
  async addWatcher(docId: string, userId: string): Promise<IDocument | null> {
    return DocumentModel.findByIdAndUpdate(
      docId,
      {
        $addToSet: { watchers: new mongoose.Types.ObjectId(userId) },
      },
      { new: true }
    )
      .populate('uploader', 'name email')
      .populate('watchers', 'name email');
  }

  /**
   * Remove watcher
   */
  async removeWatcher(docId: string, userId: string): Promise<IDocument | null> {
    return DocumentModel.findByIdAndUpdate(
      docId,
      {
        $pull: { watchers: new mongoose.Types.ObjectId(userId) },
      },
      { new: true }
    )
      .populate('uploader', 'name email')
      .populate('watchers', 'name email');
  }


   /**
   * Create a (potentially password-protected) document
   * If user provided 'recipientUserId', store doc.recipientUser
   * If user provided 'recipientEmail', store doc.recipientEmail
   */
  async createProtectedDocument(params: {
    title: string;
    description?: string;
    uploaderId: mongoose.Types.ObjectId;
    s3Key: string;
    s3Url: string;
    visibility?: string;
    passwordProtected?: boolean;
    recipientUserId?: string;  // new
    recipientEmail?: string;   // existing
    sentBy: mongoose.Types.ObjectId; // who is sending
    category?: string;
  }): Promise<IDocument> {
    const {
      title,
      description,
      uploaderId,
      s3Key,
      s3Url,
      visibility = DocumentVisibility.PRIVATE,
      passwordProtected = false,
      recipientUserId,
      recipientEmail,
      sentBy,
      category,
    } = params;

    let randomPass: string | undefined;
    if (passwordProtected) {
      randomPass = crypto.randomBytes(8).toString('hex'); 
    }

// Convert the raw string to the enum type:
        const typedVisibility = visibility === 'PUBLIC'
        ? DocumentVisibility.PUBLIC
        : DocumentVisibility.PRIVATE;

    const docData: Partial<IDocument> = {
      title,
      description,
      uploader: uploaderId,
      key: s3Key,
      url: s3Url,
      visibility: typedVisibility,
      watchers: [uploaderId],
      passwordProtected,
      encryptionKey: randomPass,
      sentBy,
      category,
    };

    if (recipientUserId) {
      docData.recipientUser = new mongoose.Types.ObjectId(recipientUserId);
      docData.watchers?.push(new mongoose.Types.ObjectId(recipientUserId));
    }
    if (recipientEmail) {
      docData.recipientEmail = recipientEmail;
      // watchers isn't strictly relevant if it's an external email
    }

    const newDoc = new DocumentModel(docData);
    const savedDoc = await newDoc.save();

    // If passwordProtected, optionally email the password 
    if (passwordProtected && randomPass) {
      let finalEmail = recipientEmail;
      // If the doc was sent to an internal user, you might also get their email from the DB
      // But for simplicity, if (recipientUserId), fetch the user?
      // Example:
      // if (recipientUserId && !recipientEmail) {
      //   const user = await User.findById(recipientUserId);
      //   finalEmail = user?.email;
      // }

      if (finalEmail) {
        const mailOptions: EmailOptions = {
          to: finalEmail,
          subject: 'Encrypted Document Shared With You',
          text: `Document Title: ${title}\nPassword: ${randomPass}\nLink: ${s3Url}`,
          html: `<p>Document <strong>${title}</strong> was shared.<br/>
                 <strong>Password:</strong> ${randomPass}<br/>
                 <a href="${s3Url}">Open Link</a></p>`,
        };
        await sendEmail(mailOptions);
      }
    }

    return savedDoc;
  }
  async getDocumentsSentToUser(userId: string): Promise<IDocument[]> {
    return DocumentModel.find({ recipientUser: userId })
      .populate('uploader', 'name email') // Populate uploader details (name, email)
      .populate('sentBy', 'name email')  // Populate sender details (name, email)
      .populate('recipientUser', 'name email'); // Populate recipient details (name, email)
  }
  

  async getDocumentsSentByUser(userId: string): Promise<IDocument[]> {
    return DocumentModel.find({ sentBy: userId })
    .populate('sentBy', 'name email')  // Populate sender details (name, email)
    .populate('uploader', 'name email');
  }

  // optional: get docs sent to the user’s email if they match
  async getDocumentsSentToEmail(email: string): Promise<IDocument[]> {
    return DocumentModel.find({ recipientEmail: email }).populate('uploader', 'name email');
  }

  /**
   * Return a presigned URL if the password matches, or throw an error
   * In a real app, you'd just let the user attempt to open the file with a PDF viewer using the password, etc.
   */
  async getDocumentWithPassword(
    docId: string,
    password: string
  ): Promise<{ doc: IDocument; presignedUrl: string }> {
    const doc = await DocumentModel.findById(docId);
    if (!doc) {
      throw new Error('Document not found.');
    }

    if (!doc.passwordProtected) {
      throw new Error('This document is not password-protected.');
    }

    if (!doc.encryptionKey || doc.encryptionKey !== password) {
      throw new Error('Invalid password for this document.');
    }

    // Generate a short-lived presigned URL to download
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: doc.key,
    });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 }); // 60 seconds
    return { doc, presignedUrl };
  }

  async addTag(docId: string, tag: string): Promise<IDocument | null> {
    const updatedDoc = await DocumentModel.findByIdAndUpdate(
      docId,
      { $addToSet: { tags: tag } }, // use $addToSet to avoid duplicates
      { new: true }
    );
    return updatedDoc;
  }

  async removeTag(docId: string, tag: string): Promise<IDocument | null> {
    const updatedDoc = await DocumentModel.findByIdAndUpdate(
      docId,
      { $pull: { tags: tag } },
      { new: true }
    );
    return updatedDoc;
  }

}

export default new DocumentService();
