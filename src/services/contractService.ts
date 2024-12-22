import Contract from '../models/Contract';
import { IContract } from '../models/Contract';

export const createContract = async (data: IContract) => {
  const contract = new Contract(data);
  return await contract.save();
};

export const getAllContracts = async () => {
  return await Contract.find().populate('contractor admin');
};

export const getContractById = async (id: string) => {
  return await Contract.findById(id).populate('contractor admin');
};

export const updateContract = async (id: string, updates: Partial<IContract>) => {
  return await Contract.findByIdAndUpdate(id, updates, { new: true });
};

export const deleteContract = async (id: string) => {
  return await Contract.findByIdAndDelete(id);
};

export const getContractsByContractor = async (contractorId: string) => {
  return await Contract.find({ contractor: contractorId })
    .populate('contractor admin');
};
