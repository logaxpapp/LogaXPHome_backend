import Contract from '../models/Contract';
import { IContract } from '../models/Contract';


/**
 * Create a contract
 */
export const createContract = async (data: Partial<IContract>) => {
  const contract = new Contract(data);
  return contract.save();
};

/**
 * Get all contracts
 */
export const getAllContracts = async () => {
  return Contract.find().populate('contractor admin');
};

/**
 * Get contract by ID
 */
export const getContractById = async (id: string) => {
  return Contract.findById(id).populate('contractor admin');
};

/**
 * Update contract by ID
 */
export const updateContract = async (id: string, updates: Partial<IContract>) => {
  return Contract.findByIdAndUpdate(
    id,
    { $set: updates }, // Explicitly use $set for updates
    { new: true, runValidators: true } // Return updated document and validate against schema
  );
};

/**
 * Delete contract by ID
 */
export const deleteContract = async (id: string) => {
  return Contract.findByIdAndDelete(id);
};

/**
 * Get contracts by contractor
 */
export const getContractsByContractor = async (contractorId: string) => {
  return Contract.find({ contractor: contractorId }).populate('contractor admin');
};
