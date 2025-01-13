// src/controllers/referenceFormController.ts

import { Request, Response, NextFunction } from 'express';
import Reference, { ReferenceStatus } from '../models/Reference';
import { uploadImageToS3 } from '../utils/s3Client'; // Optional: Upload signature to S3
import { sendReferenceConfirmationEmail } from '../utils/email'; // Optional: Send confirmation to the applicant

/**
 * Serve the Reference Form
 */
export const getReferenceFormHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Invalid or missing token.' });
      return;
    }

    const reference = await Reference.findOne({ token }).exec();

    if (!reference) {
      res.status(404).json({ message: 'Reference not found.' });
        return;
    }

    if (reference.tokenExpiresAt < new Date()) {
      res.status(400).json({ message: 'Reference link has expired.' });
      return;
    }

    if (![ReferenceStatus.Sent, ReferenceStatus.Pending].includes(reference.status)) {
      res.status(400).json({ message: 'Reference is not available for completion.' });
      return;
    }

    // Redirect to frontend form with token
    const frontendFormUrl = `${process.env.FRONTEND_URL}/fill-reference?token=${token}`;
    res.redirect(frontendFormUrl);
  } catch (error) {
    next(error);
  }
};
export const submitReferenceFormHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, performance, conduct, integrity, additionalComments, signature } = req.body;
  
      if (!token || typeof token !== 'string') {
        res.status(400).json({ message: 'Invalid or missing token.' });
        return;
      }
  
      // Populate the applicant field
      const reference = await Reference.findOne({ token })
        .populate('applicant', 'email') // Only populate the email field
        .exec();
  
      if (!reference) {
        res.status(404).json({ message: 'Reference not found.' });
        return;
      }
  
      if (reference.tokenExpiresAt < new Date()) {
        res.status(400).json({ message: 'Reference link has expired.' });
        return;
      }
  
      if (![ReferenceStatus.Sent, ReferenceStatus.Pending].includes(reference.status)) {
        res.status(400).json({ message: 'Reference is not available for completion.' });
        return;
      }
  
      // Update the reference with form data
      reference.performance = performance;
      reference.conduct = conduct;
      reference.integrity = integrity;
      reference.additionalComments = additionalComments;
      reference.status = ReferenceStatus.Received;
      reference.receivedAt = new Date();
  
      // Handle signature
      if (signature) {
        if (signature.startsWith('data:image/')) {
          // Upload signature image to S3
          const signatureURL = await uploadImageToS3(signature, reference._id);
          reference.refereeSignature = signatureURL;
        } else {
          reference.refereeSignature = signature;
        }
      } else {
        res.status(400).json({ message: 'Signature is required.' });
        return;
      }
  
      await reference.save();
  
      // Notify the applicant
      const applicant = reference.applicant as { email?: string }; // Explicitly type the applicant
      const applicantEmail = applicant?.email;
  
      if (!applicantEmail) {
        res.status(500).json({ message: 'Applicant email not found.' });
        return;
      }
  
      await sendReferenceConfirmationEmail(applicantEmail, token);
  
      res.status(200).json({ message: 'Reference submitted successfully.' });
    } catch (error: any) {
      next(error);
    }
  };
  