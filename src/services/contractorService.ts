import User from '../models/User';
import { IUser } from '../models/User';

export const getAllContractors = async () => {
  return await User.find({ role: 'contractor' }).select('-password_hash');
};
export const getContractorById = async (id: string) => {
  // Ensure we're fetching only users with the role "contractor"
  return await User.findOne({ _id: id, role: 'contractor' }).select('-password_hash');
};

export const updateContractorDetails = async (id: string, updates: Partial<IUser>) => {
  return await User.findByIdAndUpdate(id, updates, { new: true });
};
