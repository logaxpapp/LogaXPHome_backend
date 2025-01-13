// src/services/referenceService.ts

import mongoose, { ClientSession, Types } from 'mongoose';
import Reference, { IReference, ReferenceStatus } from '../models/Reference';
import User, { IUser } from '../models/User';
import Referee, { IReferee } from '../models/Referee';
import { sendReferenceEmail, sendReferenceConfirmationEmail } from '../utils/email';
import s3Client from '../utils/s3Client';
import { PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { generateReferenceToken } from '../utils/tokenGenerator';

/** 
 * The `IRefereeDetails` is used if the user/admin wants to create a **new** Referee 
 * on-the-fly, instead of providing an existing `refereeId`.
 */
interface IRefereeDetails {
  name: string;
  email: string;
  companyName: string;
  relationship: string;
  dateStarted: string; // If the front-end is sending strings, you'll parse them as Dates below
  address: string;
  positionHeld: string;
  endDate?: string; 
  reasonForLeaving: string;
  userPositionHeld: string;
  userSignature: string;         // The applicant's signature affirming the data
}

/**
 * Interface for the data required to create a Reference.
 * This includes either a `refereeId` of an existing Referee OR brand-new `refereeDetails`.
 */
export interface ICreateReferenceData {
  refereeId?: string;                  // If using an existing Referee
  refereeDetails?: {
    // Fields needed to create a brand-new Referee
    name: string;
    email: string;
    companyName: string;
    relationship: string;
    startDate: string;         // "YYYY-MM-DD"
    endDate: string;           // "YYYY-MM-DD"
    reasonForLeaving: string;
    address: string;
    positionHeld: string;
    userPositionHeld: string;
    userSignature: string;     // base64 or typed
  };

  // Fields for the Reference document
  relationship?: string;       // “Admin note” or reference relationship
  positionHeld?: string;
  startDate?: string;          // "YYYY-MM-DD"
  endDate?: string;            // "YYYY-MM-DD"
  reasonForLeaving?: string;
  salary?: string;
  performance?: string;
  conduct?: string;
  integrity?: string;
  additionalComments?: string;
  reEmploy?: string;          // "Yes", "No", or "Maybe"

  // The referee’s signature (optional)
  signature?: string;
}


/**
 * Utility Function to Upload an Image (Base64 Data URL) to S3.
 * Returns the S3 URL of the uploaded file.
 */
export const uploadImageToS3 = async (
  dataURL: string,
  referenceId: Types.ObjectId
): Promise<string> => {
  const matches = dataURL.match(/^data:image\/([A-Za-z-+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data.');
  }

  const fileType = matches[1]; // e.g., "png" or "jpeg"
  const buffer = Buffer.from(matches[2], 'base64');
  const key = `signatures/${referenceId}/${Date.now()}.${fileType}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET as string,
    Key: key,
    Body: buffer,
    ContentType: `image/${fileType}`,
    ACL: ObjectCannedACL.private,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  // Return the S3 URL of the uploaded signature
  return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
};

/**
 * Get Reference by a unique token (used for public form access).
 */
export const getReferenceByToken = async (token: string): Promise<IReference | null> => {
  return Reference.findOne({ token })
    .populate('applicant', 'name email')
    .populate('referee',
      'name email companyName relationship startDate endDate reasonForLeaving address positionHeld userPositionHeld userSignature'
    )
    .exec();
};

export async function createReference(
  data: ICreateReferenceData,
  user: IUser,
  attachments?: Express.Multer.File[]
): Promise<IReference> {
  const session = await mongoose.startSession();
  session.startTransaction();

  let savedReference: IReference; // We'll declare it outside so we can access after commit

  try {
    const { refereeId, refereeDetails, ...referenceData } = data;

    // 1) If existing Referee is chosen
    let finalRefereeId: Types.ObjectId;
    if (refereeId) {
      if (!Types.ObjectId.isValid(refereeId)) {
        throw new Error('Invalid referee ID.');
      }
      const existingRef = await Referee.findOne({
        _id: refereeId,
        user: user._id,
      }).session(session);

      if (!existingRef) {
        throw new Error('Referee not found for current user.');
      }

      finalRefereeId = existingRef._id as Types.ObjectId;
    }
    // 2) Otherwise, create a brand-new Referee
    else if (refereeDetails) {
      const parsedStart = refereeDetails.startDate?.trim()
        ? new Date(refereeDetails.startDate)
        : undefined;
      const parsedEnd = refereeDetails.endDate?.trim()
        ? new Date(refereeDetails.endDate)
        : undefined;

      const newReferee = new Referee({
        user: user._id,
        name: refereeDetails.name,
        email: refereeDetails.email,
        companyName: refereeDetails.companyName,
        relationship: refereeDetails.relationship,
        startDate: parsedStart,
        endDate: parsedEnd,
        reasonForLeaving: refereeDetails.reasonForLeaving,
        address: refereeDetails.address,
        positionHeld: refereeDetails.positionHeld,
        userPositionHeld: refereeDetails.userPositionHeld,
        userSignature: refereeDetails.userSignature,
      });

      const savedReferee = await newReferee.save({ session });
      finalRefereeId = savedReferee._id as Types.ObjectId;
    } else {
      throw new Error('Either refereeId or refereeDetails must be provided.');
    }

    // 3) Create Reference doc
    const parsedRefStart = referenceData.startDate?.trim()
      ? new Date(referenceData.startDate)
      : undefined;
    const parsedRefEnd = referenceData.endDate?.trim()
      ? new Date(referenceData.endDate)
      : undefined;

    const reference = new Reference({
      applicant: user._id,
      referee: finalRefereeId,

      relationship: referenceData.relationship || '',
      positionHeld: referenceData.positionHeld || '',
      startDate: parsedRefStart,
      endDate: parsedRefEnd,
      reasonForLeaving: referenceData.reasonForLeaving || '',
      salary: referenceData.salary || '',
      performance: referenceData.performance || '',
      conduct: referenceData.conduct || '',
      integrity: referenceData.integrity || '',
      additionalComments: referenceData.additionalComments || '',

      status: ReferenceStatus.Pending,
      createdBy: user._id,
    });

    // Generate a token
    const token = generateReferenceToken();
    reference.token = token;
    reference.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save the reference to get its _id
    savedReference = await reference.save({ session });

    // 4) Handle signature
    if (data.signature && data.signature.startsWith('data:image/')) {
      const signatureURL = await uploadImageToS3(data.signature, savedReference._id);
      savedReference.refereeSignature = signatureURL;
    } else if (data.signature) {
      savedReference.refereeSignature = data.signature;
    }

    // 5) Attachments (if any)
    if (attachments && attachments.length > 0) {
      const uploadPromises = attachments.map(async (file) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET as string,
          Key: `references/${savedReference._id}/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: ObjectCannedACL.private,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      savedReference.attachments = uploadedUrls;
    }

    // Re-save with attachments + signature
    savedReference = await savedReference.save({ session });

    // COMMIT the transaction (so DB changes are final)
    await session.commitTransaction();
    session.endSession();

    // Now that DB changes are final, we can safely populate:
    await savedReference.populate('applicant', 'name email');
    await savedReference.populate('referee', 'name email');

    // Return the reference (we will send email after)
  } catch (err) {
    // If anything failed inside the try block, we can rollback:
    await session.abortTransaction();
    session.endSession();
    throw err;
  }

  // ---- AFTER COMMIT ----
  // Here, we do a separate try/catch block for sending the email. 
  // If sending the email fails, we do *not* abortTransaction(), 
  // because we already committed.
  try {
    await sendReferenceEmail(savedReference);
  } catch (emailErr) {
    // Log or handle the email error, but no DB rollback
    console.error('Email failed:', emailErr);
    // Optionally rethrow if you want the caller to see an error
    // throw emailErr;
  }

  // Return the newly created reference
  return savedReference;
}
/**
 * Get a Reference by its MongoDB _id.
 */
export const getReferenceById = async (referenceId: string): Promise<IReference | null> => {
  if (!mongoose.Types.ObjectId.isValid(referenceId)) {
    throw new Error('Invalid Reference ID');
  }
  return Reference.findById(referenceId)
    .populate('applicant', 'name email')
    .populate('referee', 'name email companyName positionHeld')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .exec();
};

/**
 * Update a Reference with new data. 
 * Some fields may be restricted if the reference is already Completed or Rejected.
 * Attachments can be appended, and we handle an updated `refereeSignature` if provided.
 */
export const updateReference = async (
  referenceId: string,
  updates: Partial<IReference>,
  user: IUser,
  attachments?: Express.Multer.File[]
): Promise<IReference | null> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reference = await Reference.findById(referenceId).session(session);
    if (!reference) {
      throw new Error('Reference not found');
    }

    // If reference is already Completed or Rejected, do not allow updates
    if ([ReferenceStatus.Completed, ReferenceStatus.Rejected].includes(reference.status)) {
      throw new Error('Cannot update a completed or rejected reference');
    }

    // Separate out `refereeSignature` from the rest
    const { refereeSignature, ...otherUpdates } = updates;

    // Merge the rest of the fields
    Object.assign(reference, otherUpdates);
    reference.updatedBy = user._id; // track who updated

    // If the new signature is provided:
    if (refereeSignature) {
      if (refereeSignature.startsWith && refereeSignature.startsWith('data:image/')) {
        // Means it's a base64 data URL
        const signatureURL = await uploadImageToS3(refereeSignature, reference._id);
        reference.refereeSignature = signatureURL;
      } else {
        // Otherwise, treat it as typed text or a plain string
        reference.refereeSignature = refereeSignature;
      }
    }

    // If new attachments are provided, upload and append them
    if (attachments && attachments.length > 0) {
      const uploadPromises = attachments.map(async (file) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET as string,
          Key: `references/${reference._id}/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: ObjectCannedACL.private,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
        return fileUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      // Merge new attachments into existing array
      reference.attachments = reference.attachments
        ? [...reference.attachments, ...uploadedUrls]
        : uploadedUrls;
    }

    const updatedReference = await reference.save({ session });

    await session.commitTransaction();
    session.endSession();
    return updatedReference;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Delete a reference by ID.
 * This typically only removes the Reference doc; 
 * consider if you also want to remove attachments from S3, etc.
 */
export const deleteReference = async (referenceId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(referenceId)) {
    throw new Error('Invalid Reference ID');
  }
  await Reference.findByIdAndDelete(referenceId).exec();
};

/**
 * Send a Reference to the referee (if it's in Pending status).
 * This changes the status to Sent, sets `sentAt`, etc. 
 * Then calls the email logic to actually notify them.
 */
export const sendReference = async (referenceId: string, user: IUser): Promise<IReference> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reference = await Reference.findById(referenceId).populate('applicant referee').session(session);
    if (!reference) {
      throw new Error('Reference not found');
    }

    if (reference.status !== ReferenceStatus.Pending) {
      throw new Error('Reference cannot be sent in its current status');
    }

    // Call your email function
    await sendReferenceEmail(reference);

    reference.status = ReferenceStatus.Sent;
    reference.sentAt = new Date();
    reference.updatedBy = user._id;

    await reference.save({ session });

    await session.commitTransaction();
    session.endSession();
    return reference;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Mark a Reference as Received.
 * Typically means the referee has clicked the link/form and filled out the data.
 */
export const receiveReference = async (referenceId: string, user: IUser): Promise<IReference> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reference = await Reference.findById(referenceId).session(session);
    if (!reference) {
      throw new Error('Reference not found');
    }

    if (reference.status !== ReferenceStatus.Sent) {
      throw new Error('Reference cannot be received in its current status');
    }

    reference.status = ReferenceStatus.Received;
    reference.receivedAt = new Date();
    reference.updatedBy = user._id;

    await reference.save({ session });

    await session.commitTransaction();
    session.endSession();
    return reference;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Complete a Reference.
 * Usually means the admin or the system acknowledges all data is final.
 */
export const completeReference = async (referenceId: string, user: IUser): Promise<IReference> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reference = await Reference.findById(referenceId).session(session);
    if (!reference) {
      throw new Error('Reference not found');
    }

    if (reference.status !== ReferenceStatus.Received) {
      throw new Error('Reference cannot be completed in its current status');
    }

    reference.status = ReferenceStatus.Completed;
    reference.completedAt = new Date();
    reference.updatedBy = user._id;

    await reference.save({ session });

    await session.commitTransaction();
    session.endSession();
    return reference;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Reject a Reference with a specified reason, if it is currently "Sent".
 */
export const rejectReference = async (
  referenceId: string,
  rejectionReason: string,
  user: IUser
): Promise<IReference> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const reference = await Reference.findById(referenceId).session(session);
    if (!reference) {
      throw new Error('Reference not found');
    }

    if (reference.status !== ReferenceStatus.Sent) {
      throw new Error('Reference cannot be rejected in its current status');
    }

    reference.status = ReferenceStatus.Rejected;
    reference.rejectionReason = rejectionReason;
    reference.updatedBy = user._id;

    await reference.save({ session });

    await session.commitTransaction();
    session.endSession();
    return reference;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Interface for listing references with optional filters & pagination.
 */
export interface ListReferencesParams {
  applicantId?: string;
  refereeId?: string;
  status?: ReferenceStatus;
  search?: string; // Search by relationship or positionHeld
  page?: number;
  limit?: number;
}

/**
 * List References with various filters (applicantId, refereeId, status, search)
 * plus pagination (page, limit). Returns both the array of references and total count.
 */
export const listReferences = async (
  params: ListReferencesParams
): Promise<{ references: IReference[]; total: number }> => {
  const { applicantId, refereeId, status, search, page = 1, limit = 10 } = params;

  const query: any = {};

  if (applicantId) {
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      throw new Error('Invalid Applicant ID');
    }
    query.applicant = applicantId;
  }

  if (refereeId) {
    if (!mongoose.Types.ObjectId.isValid(refereeId)) {
      throw new Error('Invalid Referee ID');
    }
    query.referee = refereeId;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    // We do a case-insensitive match on `relationship` or `positionHeld`
    query.$or = [
      { relationship: { $regex: search, $options: 'i' } },
      { positionHeld: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  // Fetch references & total concurrently
  const [references, total] = await Promise.all([
    Reference.find(query)
      .populate('applicant', 'name email')
      .populate('referee', 'name email companyName positionHeld')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Reference.countDocuments(query).exec(),
  ]);

  return { references, total };
};
