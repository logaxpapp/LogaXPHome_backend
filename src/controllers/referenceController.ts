import { Request, Response, NextFunction } from 'express';
import {
  createReference,
  getReferenceById,
  getReferenceByToken,
  updateReference,
  deleteReference,
  sendReference,
  receiveReference,
  completeReference,
  rejectReference,
  listReferences,
  ListReferencesParams,
} from '../services/referenceService';
import Reference, { ReferenceStatus, IReference } from '../models/Reference';
import { IReferee } from '../models/Referee';
import { IUser } from '../models/User';
import { sendReferenceConfirmationEmail } from '../utils/email';
import { uploadImageToS3 } from '../utils/s3Client';

/**
 * Create a new reference
 */
export const createReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('createReferenceHandler -> req.body:', req.body);

    const user = req.user as IUser;

    // Pull out everything the backend expects in createReference
    const data = {
      refereeId: req.body.refereeId,
      refereeDetails: req.body.refereeDetails, // if creating new referee
      relationship: req.body.relationship,
      positionHeld: req.body.positionHeld,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reasonForLeaving: req.body.reasonForLeaving,
      salary: req.body.salary,
      performance: req.body.performance,
      conduct: req.body.conduct,
      integrity: req.body.integrity,
      additionalComments: req.body.additionalComments,
      signature: req.body.signature, // top-level signature for Reference
      reEmploy: req.body.reEmploy,
    };

    console.log('createReferenceHandler -> final data object:', data);

    // If you have file uploads
    const attachments = req.files as Express.Multer.File[] | undefined;

    const reference = await createReference(data, user, attachments);
     res.status(201).json(reference);
      return;
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a reference by ID
 */
export const getReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    const reference = await getReferenceById(referenceId);
    if (!reference) {
       res.status(404).json({ message: 'Reference not found' });
        return;
    }
    // Optionally check if user is allowed to see it ...
     res.status(200).json(reference);
      return;
  } catch (error) {
    next(error);
  }
};

/**
 * Update a reference
 */
export const updateReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    const user = req.user as IUser;
    const updates: Partial<IReference> = req.body;

    const attachments = req.files as Express.Multer.File[] | undefined;
    const updatedRef = await updateReference(referenceId, updates, user, attachments);
    if (!updatedRef) {
       res.status(404).json({ message: 'Reference not found or cannot be updated' });
        return;
    }
     res.status(200).json(updatedRef);
      return;
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a reference
 */
export const deleteReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    await deleteReference(referenceId);
     res.status(200).json({ message: 'Reference deleted successfully' });
      return;
  } catch (error) {
    next(error);
  }
};

/**
 * Send a reference (status -> Sent)
 */
export const sendReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    const user = req.user as IUser;

    const ref = await sendReference(referenceId, user);
     res.status(200).json(ref);
      return;
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a reference as Received
 */
export const receiveReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    const user = req.user as IUser;
    const ref = await receiveReference(referenceId, user);
     res.status(200).json(ref);
      return;
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a reference (status -> Completed)
 */
export const completeReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    const user = req.user as IUser;
    const ref = await completeReference(referenceId, user);
     res.status(200).json(ref);
     return;
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a reference (status -> Rejected)
 */
export const rejectReferenceHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    const { rejectionReason } = req.body;
    const user = req.user as IUser;

    if (!rejectionReason || !rejectionReason.trim()) {
       res.status(400).json({ message: 'Rejection reason is required' });
        return;
    }

    const ref = await rejectReference(referenceId, rejectionReason, user);
     res.status(200).json(ref);
     return;
  } catch (error) {
    next(error);
  }
};

/**
 * List references with optional filters (applicantId, refereeId, status, search) + pagination
 */
export const listReferencesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicantId, refereeId, status, search, page, limit } = req.query;
    const params: ListReferencesParams = {
      applicantId: applicantId ? String(applicantId) : undefined,
      refereeId: refereeId ? String(refereeId) : undefined,
      status: status as ReferenceStatus,
      search: search ? String(search) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 10,
    };
    const { references, total } = await listReferences(params);
     res.status(200).json({ references, total, page: params.page, limit: params.limit });
      return;
  } catch (error) {
    next(error);
  }
};

/**
 * Public route: get the Reference form by token.
 * If valid & not expired, redirect to your front-end form.
 */
export const getReferenceFormHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Invalid or missing token.' });
      return;
    }

    const reference = await getReferenceByToken(token);
    if (!reference) {
      res.status(404).json({ message: 'Reference not found.' });
      return;
    }

    // Check expiry, status, etc.
    if (reference.tokenExpiresAt < new Date()) {
       res.status(400).json({ message: 'Reference link has expired.' });
        return;
    }
    if (![ReferenceStatus.Sent, ReferenceStatus.Pending].includes(reference.status)) {
       res.status(400).json({ message: 'Reference is not available for completion.' });
        return;
    }

    // Return the reference JSON (with applicant/referee populated)
     res.status(200).json({
      message: 'Reference is valid',
      reference: {
        _id: reference._id,
        status: reference.status,
        token: reference.token,
        tokenExpiresAt: reference.tokenExpiresAt,

        // Populated Applicant
        applicant: reference.applicant, 
        // Populated Referee
        referee: reference.referee,

        // Any other fields (salary, performance, etc. if you want them).
        salary: reference.salary,
        performance: reference.performance,
        // ...
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

/**
 * Public route: submit the Reference form (the referee fills it in).
 */
export const submitReferenceFormHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Destructure all the form fields from the request body
    const {
      token,
      startDate,
      endDate,
      positionHeld,
      relationship,
      reasonForLeaving,
      salary,
      daysAbsent,
      periodsAbsent,
      conduct,
      performance,
      integrity,
      additionalComments,
      reEmploy,
      refereeSignature,
      // Existing fields (like name, address) plus companyName
      name,
      address,
      companyName,
    } = req.body;

    // Basic validation for token
    if (!token || typeof token !== 'string') {
       res.status(400).json({ message: 'Invalid or missing token.' });
        return;
    }

    // Find the Reference by token
    const reference = await Reference.findOne({ token }).populate('applicant', 'email');
    if (!reference) {
       res.status(404).json({ message: 'Reference not found.' });
        return;
    }

    // Check if token is expired
    if (reference.tokenExpiresAt < new Date()) {
       res.status(400).json({ message: 'Reference link has expired.' });
        return;
    }

    // Ensure status allows for completion
    if (![ReferenceStatus.Sent, ReferenceStatus.Pending].includes(reference.status)) {
       res
        .status(400)
        .json({ message: 'Reference is not available for completion.' });
        return;
    }

    /**
     * Update fields if present in the request body
     */
    if (startDate) {
      reference.startDate = new Date(startDate);
    }
    if (endDate) {
      reference.endDate = new Date(endDate);
    }
    if (positionHeld) {
      reference.positionHeld = positionHeld;
    }
    if (relationship) {
      reference.relationship = relationship;
    }
    if (reasonForLeaving) {
      reference.reasonForLeaving = reasonForLeaving;
    }
    if (salary) {
      reference.salary = salary;
    }
    if (daysAbsent) {
      reference.daysAbsent = daysAbsent;
    }
    if (periodsAbsent) {
      reference.periodsAbsent = periodsAbsent;
    }
    if (conduct) {
      reference.conduct = conduct;
    }
    if (performance) {
      reference.performance = performance;
    }
    if (integrity) {
      reference.integrity = integrity;
    }
    if (additionalComments) {
      reference.additionalComments = additionalComments;
    }
    if (reEmploy) {
      reference.reEmploy = reEmploy;
    }

    // Now handle name, address, and companyName
    if (name) {
      reference.name = name;
    }
    if (address) {
      reference.address = address;
    }
    if (companyName) {
      reference.companyName = companyName;
    }

    // Handle referee signature
    if (!refereeSignature) {
       res.status(400).json({ message: 'Signature is required.' });
        return;
    }
    if (refereeSignature.startsWith('data:image/')) {
      // If it's a dataURL, handle as an image upload
      const signatureURL = await uploadImageToS3(refereeSignature, reference._id);
      reference.refereeSignature = signatureURL;
    } else {
      // Otherwise, consider it a typed signature
      reference.refereeSignature = refereeSignature;
    }

    // Finalize status
    reference.status = ReferenceStatus.Received;
    reference.receivedAt = new Date();

    // Save the updated reference
    await reference.save();

    // Optionally notify the applicant via email
    const applicant = reference.applicant as { email?: string };
    if (!applicant?.email) {
       res
        .status(500)
        .json({ message: 'Applicant email not found; could not send confirmation.' });
        return;
    }
    await sendReferenceConfirmationEmail(applicant.email, token);

    // Respond with success
     res.status(200).json({ message: 'Reference submitted successfully.' });
      return;
  } catch (error) {
    next(error);
  }
};

export const auditReferenceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { referenceId } = req.params;

    // 1) Look up the Reference & populate the 'referee' sub-document
    const reference = await Reference.findById(referenceId)
      .populate('referee')
      .exec();

    if (!reference) {
       res.status(404).json({ message: 'Reference not found.' });
        return;
    }

    // 2) Extract the referee doc
    const refereeDoc = reference.referee as IReferee;
    if (!refereeDoc) {
       res.status(404).json({ message: 'Referee not found.' });
        return;
    }

    // 3) Build a comparison for each "common" field
    //    You can tailor this structure as needed.
    const comparison = {
      name: {
        fromReferee: refereeDoc.name,
        fromReference: reference.name,
      },
      companyName: {
        fromReferee: refereeDoc.companyName,
        fromReference: reference.companyName,
      },
      relationship: {
        fromReferee: refereeDoc.relationship,
        fromReference: reference.relationship,
      },
      startDate: {
        fromReferee: refereeDoc.startDate,
        fromReference: reference.startDate,
      },
      endDate: {
        fromReferee: refereeDoc.endDate,
        fromReference: reference.endDate,
      },
      reasonForLeaving: {
        fromReferee: refereeDoc.reasonForLeaving,
        fromReference: reference.reasonForLeaving,
      },
      address: {
        fromReferee: refereeDoc.address,
        fromReference: reference.address,
      },
      positionHeld: {
        fromReferee: refereeDoc.positionHeld,
        fromReference: reference.positionHeld,
      },
    };

    // 4) Respond with a structured object
     res.status(200).json({
      referenceId: reference._id,
      refereeId: refereeDoc._id,
      comparison,
    });
    return;
  } catch (error) {
    next(error);
  }
};