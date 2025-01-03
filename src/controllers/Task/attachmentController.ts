import { Request, Response, NextFunction } from 'express';
import { uploadFileToS3, deleteFileFromS3 } from '../../services/Task/attachmentService';
import Attachment from '../../models/Task/Attachment';
import mongoose from'mongoose';

/**
 * Upload a single attachment
 */
export const uploadSingleAttachmentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cardId } = req.body;
    const file = req.file;

    if (!file || !cardId) {
      res.status(400).json({ message: 'File and cardId are required.' });
      return;
    }

    const { url, key } = await uploadFileToS3(file);

    const attachment = await Attachment.create({
      card: cardId,
      uploader: req.user?._id,
      filename: file.originalname,
      url,
      key,
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Error uploading single attachment:', error);
    next(error);
  }
};

/**
 * Upload multiple attachments
 */
export const uploadMultipleAttachmentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cardId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0 || !cardId) {
      res.status(400).json({ message: 'Files and cardId are required.' });
      return;
    }

    const attachments = [];
    for (const file of files) {
      const { url, key } = await uploadFileToS3(file);

      const attachment = await Attachment.create({
        card: cardId,
        uploader: req.user?._id,
        filename: file.originalname,
        url,
        key,
      });

      attachments.push(attachment);
    }

    res.status(201).json(attachments);
  } catch (error) {
    console.error('Error uploading multiple attachments:', error);
    next(error);
  }
};
/**
 * Delete an attachment
 */
export const deleteAttachmentHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { attachmentId } = req.params;
  
      const attachment = await Attachment.findById(attachmentId);
      if (!attachment) {
        res.status(404).json({ message: 'Attachment not found.' });
        return;
      }
  
      // Use key to delete the file from S3
      await deleteFileFromS3(attachment.key);
  
      // Use deleteOne instead of remove
      await attachment.deleteOne();
  
      res.status(200).json({ message: 'Attachment deleted successfully.' });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      next(error);
    }
  };


  export const getAttachmentsByCardHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id: cardId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(cardId)) {
            res.status(400).json({ message: 'Invalid card ID format.' });
            return;
        }

        const attachments = await Attachment.find({ card: cardId });

        if (!attachments.length) {
            res.status(404).json({ message: 'No attachments found for this card.' });
            return;
        }

        res.status(200).json(attachments);
    } catch (error) {
        console.error('Error fetching attachments:', error);
        next(error);
    }
};