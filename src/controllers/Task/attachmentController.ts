import { Request, Response, NextFunction } from 'express';
import { uploadFileToS3, deleteFileFromS3 } from '../../services/Task/attachmentService';
import Attachment from '../../models/Task/Attachment';
import Card from '../../models/Task/Card';
import mongoose from'mongoose';

/**
 * Upload a single attachment
 */
export const uploadSingleAttachmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cardId } = req.body;
    const file = req.file;

    if (!file || !cardId) {
      res.status(400).json({ message: 'File and cardId are required.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Verify that the card exists
    const card = await Card.findById(cardId).session(session);
    if (!card) {
      res.status(404).json({ message: 'Card not found.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Upload file to S3
    const { url, key } = await uploadFileToS3(file);

    // Create the attachment
    const attachment = new Attachment({
      card: cardId,
      uploader: req.user?._id,
      filename: file.originalname,
      url,
      key,
    });

    const savedAttachment = await attachment.save({ session });

    // Update the card's attachments array
    card.attachments.push(savedAttachment._id);
    await card.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedAttachment);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error uploading single attachment:', error);
    next(error);
  }
};

/**
 * Upload multiple attachments
 */
export const uploadMultipleAttachmentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cardId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0 || !cardId) {
      res.status(400).json({ message: 'Files and cardId are required.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Verify that the card exists
    const card = await Card.findById(cardId).session(session);
    if (!card) {
      res.status(404).json({ message: 'Card not found.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const attachments = [];

    for (const file of files) {
      // Upload file to S3
      const { url, key } = await uploadFileToS3(file);

      // Create the attachment
      const attachment = new Attachment({
        card: cardId,
        uploader: req.user?._id,
        filename: file.originalname,
        url,
        key,
      });

      const savedAttachment = await attachment.save({ session });
      attachments.push(savedAttachment);

      // Update the card's attachments array
      card.attachments.push(savedAttachment._id);
    }

    await card.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(attachments);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error uploading multiple attachments:', error);
    next(error);
  }
};

/**
 * Delete an attachment
 */
export const deleteAttachmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      res.status(400).json({ message: 'Invalid attachment ID format.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const attachment = await Attachment.findById(attachmentId).session(session);
    if (!attachment) {
      res.status(404).json({ message: 'Attachment not found.' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Use key to delete the file from S3
    await deleteFileFromS3(attachment.key);

    // Remove the attachment from the card's attachments array
    await Card.findByIdAndUpdate(attachment.card, { $pull: { attachments: attachment._id } }).session(session);

    // Delete the attachment
    await attachment.deleteOne({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Attachment deleted successfully.' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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