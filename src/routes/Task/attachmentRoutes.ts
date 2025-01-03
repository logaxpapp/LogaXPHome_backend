import { Router } from 'express';
import multer from 'multer';
import {
  uploadSingleAttachmentHandler,
  uploadMultipleAttachmentsHandler,
  deleteAttachmentHandler,
  getAttachmentsByCardHandler,
} from '../../controllers/Task/attachmentController';
import { authenticateJWT } from '../../middlewares/authMiddleware';

const router = Router();
const upload = multer(); // Memory storage for file uploads

// Apply authentication middleware
router.use(authenticateJWT);

/**
 * @route   POST /api/attachments/single
 * @desc    Upload a single attachment
 * @access  Private
 */
router.post('/single', upload.single('file'), uploadSingleAttachmentHandler);

/**
 * @route   POST /api/attachments/multiple
 * @desc    Upload multiple attachments
 * @access  Private
 */
router.post('/multiple', upload.array('files', 10), uploadMultipleAttachmentsHandler); // Maximum of 10 files

/**
 * @route   GET /api/cards/:cardId/attachments
 * @desc    Get all attachments for a card
 * @access  Private
 */
router.get('/:id', getAttachmentsByCardHandler);

/**
 * @route   DELETE /api/attachments/:attachmentId
 * @desc    Delete an attachment
 * @access  Private
 */
router.delete('/:attachmentId', deleteAttachmentHandler);

export default router;
