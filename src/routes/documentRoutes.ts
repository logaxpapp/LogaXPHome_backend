// src/routes/documentRoutes.ts
import { Router } from 'express';
import documentController from '../controllers/documentController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import upload from '../utils/multerConfigs';
// If you have roles you want to enforce:


const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * Upload a document
 * POST /api/documents
 * Body fields: title, description, visibility (optional: 'PUBLIC' or 'PRIVATE')
 * File: attachment
 */
router.post(
  '/',
  upload.single('attachment'),          // Multer upload to S3
  documentController.uploadDocument     // Create document in DB
);

// createProtectedDoc
router.post(
  '/protected',
  upload.single('attachment'),          // Multer upload to S3
  documentController.createProtectedDoc     // Create document in DB
);

/**
 * Sent documents route - define BEFORE the :docId route
 */
router.get('/sent', documentController.getSentDocuments);

router.post('/:docId/tags', documentController.addTag);
router.delete('/:docId/tags', documentController.removeTag);

/**
 * Get document by ID
 * GET /api/documents/:docId
 */
router.get('/:docId', documentController.getDocumentById);

/**
 * Get all documents
 * GET /api/documents
 * (optionally ?visibility=PUBLIC to filter, or skip/limit for pagination)
 */
router.get('/', documentController.getAllDocuments);


/**
 * Update document
 * PUT /api/documents/:docId
 */
router.put('/:docId', documentController.updateDocument);

/**
 * Delete document
 * DELETE /api/documents/:docId
 */
router.delete('/:docId', documentController.deleteDocument);

/**
 * Delete document from S3 Bucket  //deleteDocuments3Bucket
 * DELETE /api/documents/:docId
 */
router.delete('/s3/:docId', documentController.deleteDocuments3Bucket);

/**
 * Add a watcher
 * POST /api/documents/:docId/watchers
 * Body: { userId: '...' }
 */
router.post('/:docId/watchers', documentController.addWatcher);

/**
 * Remove a watcher
 * DELETE /api/documents/:docId/watchers/:userId
 */
router.delete('/:docId/watchers/:userId', documentController.removeWatcher);


/**
 * Download a password-protected doc (returns presigned URL if password correct)
 * POST /api/documents/protected/:docId/download
 * Body: { password: "the randomPass" }
 */
router.post(
    '/protected/:docId/download',
    documentController.downloadProtectedDoc
  );


export default router;
