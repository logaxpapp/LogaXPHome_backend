import { Request, Response } from 'express';
import * as contractService from '../services/contractService';
import Contract from '../models/Contract';

export const getContracts = async (req: Request, res: Response) => {
  try {
    const contracts = await contractService.getAllContracts();
    res.status(200).json(contracts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contracts', error });
  }
};

export const getContractByID = async (req: Request, res: Response) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }
     res.status(200).json(contract);
     return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contract', error });
    return;
  }
};


export const createContract = async (req: Request, res: Response) => {
  try {
    // Ensure `req.user` is defined and contains the authenticated user's ID
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: No user found in request' });
      return;
    }

    const adminId = req.user._id; // Retrieve the admin's ID from `req.user`

    // Add the adminId to the contract data
    const contractData = { ...req.body, admin: adminId };

    const newContract = await contractService.createContract(contractData);

    res.status(201).json(newContract);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create contract', error });
  }
};


export const updateContract = async (req: Request, res: Response) => {
  try {
    const updatedContract = await contractService.updateContract(req.params.id, req.body);
    res.status(200).json(updatedContract);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contract', error });
  }
};

export const deleteContract = async (req: Request, res: Response) => {
  try {
    await contractService.deleteContract(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete contract', error });
  }
};


export const acceptContract = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const contract = await Contract.findById(id);

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    contract.status = 'Active';
    contract.contractorResponse = { response: 'Accepted', notes: '' };
    await contract.save();

    res.json({ message: 'Contract accepted successfully', contract });
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept contract', error });
  }
};

export const declineContract = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const contract = await Contract.findById(id);

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    contract.status = 'Draft';
    contract.contractorResponse = { response: 'Declined', notes: reason };
    await contract.save();

    res.json({ message: 'Contract declined successfully', contract });
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline contract', error });
  }
};

export const updateContractStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const allowedStatuses = ['Draft', 'Pending', 'Active', 'Completed', 'Terminated'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const contract = await Contract.findById(id);

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    contract.status = status;
    await contract.save();

    res.json({ message: 'Contract status updated successfully', contract });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contract status', error });
  }
};


export const getContractsByContractor = async (req: Request, res: Response) => {
  try {
    const { contractorId } = req.params;
    const contracts = await contractService.getContractsByContractor(contractorId);
    res.status(200).json(contracts);
  } catch (error) {
    console.error('Error fetching contracts by contractor:', error);
    res.status(500).json({ message: 'Failed to fetch contracts by contractor', error });
  }
};
  