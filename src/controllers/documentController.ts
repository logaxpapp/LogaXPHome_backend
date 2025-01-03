// src/controllers/documentController.ts
import { Request, Response, NextFunction } from 'express';
import documentService from '../services/documentService';
import { DocumentVisibility } from '../models/Document';
import { io } from '../app';
import { IUser } from '../models/User';
import { UserRole } from '../types/enums';
import { IDocument } from '../models/Document';


class DocumentController {
  /**
   * Upload a document
   * (multer-S3 attaches `req.file` with `key` and `location`)
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      if (!user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      const { title, description, visibility, category } = req.body;
      const s3Key = (req.file as any).key;   // from multer-s3
      const s3Url = (req.file as any).location; // from multer-s3 (public URL)
      const docVisibility =
        visibility === 'PUBLIC' ? DocumentVisibility.PUBLIC : DocumentVisibility.PRIVATE;

      const newDoc = await documentService.createDocument(
        title,
        description,
        user._id,
        s3Key,
        s3Url,
        docVisibility,
        category
      );

      res.status(201).json(newDoc);
      return;
    } catch (error: any) {
      next(error);
    }
  }

  
  /**
   * Helper: can user see a PRIVATE doc?
   */
  private canViewPrivateDoc(user: IUser | undefined, doc: any): boolean {
    if (!user) return false;
    // Admin can see anything
    if (user.role === UserRole.Admin) return true;
    // If user is the uploader
    if (doc.uploader && doc.uploader._id?.toString() === user._id.toString()) return true;
    // If user is in watchers
    if (doc.watchers?.some((w: any) => w._id?.toString() === user._id.toString())) return true;
    return false;
  }

  /**
   * Helper: can user edit doc?
   */
  private canEditDoc(user: IUser | undefined, doc: any): boolean {
    if (!user) return false;
    if (user.role === UserRole.Admin) return true;
    if (doc.uploader && doc.uploader._id?.toString() === user._id.toString()) return true;
    return false;
  }

  /**
   * Get document by ID
   */
  public getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const docId = req.params.docId;
      const doc = await documentService.getDocumentById(docId);
      if (!doc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }
      if (
        doc.visibility === DocumentVisibility.PRIVATE &&
        !this.canViewPrivateDoc(req.user as IUser, doc)
      ) {
        res.status(403).json({ message: 'Access denied. Private document.' });
        return;
      }
      res.status(200).json(doc);
        return;
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get all documents (optionally filtered)
   */
  async getAllDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: any = {};
      // Example: if you want a "visibility" filter from query
      if (req.query.visibility) {
        filters.visibility = req.query.visibility;
      }
      if (req.query.category) {
        filters.category = req.query.category;
      }
      const skip = parseInt(req.query.skip as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      // If you want to hide private docs from those who don't have permission:
      //   We only show private docs that the user can see (uploader or watchers)
      const user = req.user as IUser;
      if (user?.role !== UserRole.Admin) {
        // A simplistic approach: docs that are PUBLIC OR user is in watchers OR user is the uploader
        filters.$or = [
          { visibility: DocumentVisibility.PUBLIC },
          { watchers: user?._id },
          { uploader: user?._id },
        ];
      }

      const { documents, total } = await documentService.getAllDocuments(filters, {
        skip,
        limit,
        sort: { createdAt: -1 },
      });

      res.status(200).json({ documents, total });
      return;
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Update document metadata (title, description, visibility)
   */
  async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const docId = req.params.docId;
      const { title, description, visibility, category } = req.body;

      // Find existing doc
      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }

      // Only the uploader or admin can update the doc
      if (!this.canEditDoc(user, existingDoc)) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }

      const updatedData: any = {};
      if (title !== undefined) updatedData.title = title;
      if (description !== undefined) updatedData.description = description;
      if (visibility === 'PUBLIC' || visibility === 'PRIVATE') {
        updatedData.visibility = visibility;
      if (category !== undefined) updatedData.category = category;
      }

      const updatedDoc = await documentService.updateDocument(docId, updatedData);
      res.status(200).json(updatedDoc);
        return;
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const docId = req.params.docId;    //   const deletedDoc = await documentService.deleteDocumentS3Bucket(docId);

      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }

      // Only the uploader or admin can delete
      if (!this.canEditDoc(user, existingDoc)) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }

      const deletedDoc = await documentService.deleteDocument(docId);
      if (!deletedDoc) {
        res.status(404).json({ message: 'Document not found or already deleted' });
        return;
      }

      res.status(200).json({ message: 'Document deleted successfully' });
        return;
    } catch (error: any) {
      next(error);
    }
  }
  
  
  /**
   * Delete a document
   */
  async deleteDocuments3Bucket(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const docId = req.params.docId;    //   

      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }

      // Only the uploader or admin can delete
      if (!this.canEditDoc(user, existingDoc)) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }

      const deletedDoc = await documentService.deleteDocumentS3Bucket(docId);
      if (!deletedDoc) {
        res.status(404).json({ message: 'Document not found or already deleted' });
        return;
      }

      res.status(200).json({ message: 'Document deleted successfully' });
        return;
    } catch (error: any) {
      next(error);
    }
  }
  /**
   * Add a watcher (for PRIVATE docs)
   */
  async addWatcher(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const docId = req.params.docId;
      const { userId } = req.body;

      // Fetch doc first
      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }

      // Only the doc uploader or admin can add watchers
      if (!this.canEditDoc(user, existingDoc)) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }

      const updatedDoc = await documentService.addWatcher(docId, userId);
      res.status(200).json(updatedDoc);
        return;
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Remove a watcher
   */
  async removeWatcher(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      const docId = req.params.docId;
      const { userId } = req.params; // e.g. /documents/:docId/watchers/:userId

      // Fetch doc first
      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }

      // Only doc uploader or admin can remove watchers
      if (!this.canEditDoc(user, existingDoc)) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }

      const updatedDoc = await documentService.removeWatcher(docId, userId);
      res.status(200).json(updatedDoc);
      return;
    } catch (error: any) {
      next(error);
    }
  }


  async createProtectedDoc(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as IUser;
      if (!user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      const {
        title,
        description,
        visibility = 'PRIVATE',
        passwordProtected,
        recipientEmail,
        recipientUserId,
      } = req.body;

      const s3Key = (req.file as any).key;
      const s3Url = (req.file as any).location;

      const doc = await documentService.createProtectedDocument({
        title,
        description,
        uploaderId: user._id,
        s3Key,
        s3Url,
        visibility,
        passwordProtected: passwordProtected === 'true', 
        recipientUserId,
        recipientEmail,
        sentBy: user._id,   // This is who performed the "send"
      });

      res.status(201).json(doc);
      return;
    } catch (error) {
      next(error);
    }
  }

  // Additional endpoints to fetch "sent" docs
  async getSentDocuments(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      if (!user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      //  /documents/sent?filter=toMe or byMe
      const filter = req.query.filter;
      let docs: IDocument[] = []; // or an empty array initially

            if (filter === 'toMe') {
            docs = await documentService.getDocumentsSentToUser(user._id.toString());
            } else if (filter === 'byMe') {
            docs = await documentService.getDocumentsSentByUser(user._id.toString());
            } else {
            docs = [];
            }

        res.json(docs);
            } catch (error) {
            res.status(500).json({ message: error instanceof Error ? error.message : 'Server Error' });
            }
        }
  /**
   * 2. Download a password-protected doc by ID
   * Provide docId as param, password in the body
   * Returns { presignedUrl } if successful
   */
  async downloadProtectedDoc(req: Request, res: Response, next: NextFunction) {
    try {
      const { docId } = req.params;
      const { password } = req.body;
      if (!password) {
        res.status(400).json({ message: 'Password is required.' });
        return;
      }

      const { doc, presignedUrl } = await documentService.getDocumentWithPassword(docId, password);

      res.status(200).json({ doc, presignedUrl });
      return;
    } catch (error) {
      next(error);
    }
  }

  public addTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const { docId } = req.params;
      const { tag } = req.body;
      
      // Fetch doc first
      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }

      // Only doc owner or admin can add tags (or watchers if you want)
      if (!this.canEditDoc(user, existingDoc)) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }
      
      const updatedDoc = await documentService.addTag(docId, tag);
      res.status(200).json(updatedDoc);
        return
    } catch (error: any) {
      next(error);
    }
  };

  public removeTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const { docId } = req.params;
      const { tag } = req.body;
      
      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        res.status(404).json({ message: 'Document not found' });
        return;
      }

      if (!this.canEditDoc(user, existingDoc)) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }
      
      const updatedDoc = await documentService.removeTag(docId, tag);
      res.status(200).json(updatedDoc);
      return;
    } catch (error: any) {
      next(error);
    }
  };
}

export default new DocumentController();
