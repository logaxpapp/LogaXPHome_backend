import mongoose from 'mongoose';
import Referee, { IReferee } from '../models/Referee';
import { IUser } from '../models/User';

/**
 * Add a new referee for a user
 */
export const addReferee = async (
  userId: mongoose.Types.ObjectId, 
  refereeData: Partial<IReferee>
): Promise<IReferee> => {
  // Basic validation checks (you can also rely on Mongoose validation)
  if (!refereeData.email) {
    throw new Error('Referee email is required.');
  }
  if (!refereeData.userSignature) {
    throw new Error('User signature is required.');
  }

  // Check if referee already exists for this user
  let referee = await Referee.findOne({ email: refereeData.email, user: userId });

  if (!referee) {
    // Create a new referee
    referee = new Referee({
      user: userId,
      ...refereeData,
    });
    await referee.save();
  }

  return referee;
};

/**
 * Get all referees for a user with optional search (by name/company) and pagination
 */
export const getReferees = async (
  userId: mongoose.Types.ObjectId,
  search: string = '',
  page: number = 1,
  limit: number = 10
): Promise<{ referees: IReferee[]; total: number }> => {
  const query: any = { user: userId };

  if (search) {
    const regex = new RegExp(search, 'i'); // Case-insensitive search
    query.$or = [{ name: regex }, { companyName: regex }];
  }

  const total = await Referee.countDocuments(query);

  const referees = await Referee.find(query)
    .sort({ createdAt: -1 })       // Sort by creation date descending
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  return { referees, total };
};

/**
 * Get a referee by ID
 */
export const getRefereeById = async (
  refereeId: string, 
  userId: mongoose.Types.ObjectId
): Promise<IReferee | null> => {
  if (!mongoose.Types.ObjectId.isValid(refereeId)) {
    throw new Error('Invalid Referee ID');
  }

  const referee = await Referee.findOne({ _id: refereeId, user: userId }).exec();
  return referee;
};

/**
 * Update a referee
 */
export const updateReferee = async (
  refereeId: string, 
  userId: mongoose.Types.ObjectId, 
  updates: Partial<IReferee>
): Promise<IReferee | null> => {
  if (!mongoose.Types.ObjectId.isValid(refereeId)) {
    throw new Error('Invalid Referee ID');
  }

  const updatedReferee = await Referee.findOneAndUpdate(
    { _id: refereeId, user: userId },
    updates,
    { new: true }
  ).exec();

  return updatedReferee;
};

/**
 * Delete a referee
 */
export const deleteReferee = async (
  refereeId: string, 
  userId: mongoose.Types.ObjectId
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(refereeId)) {
    throw new Error('Invalid Referee ID');
  }

  await Referee.findOneAndDelete({ _id: refereeId, user: userId }).exec();
};
