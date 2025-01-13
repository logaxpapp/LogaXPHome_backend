import { Request, Response } from 'express';
import * as contractService from '../services/contractService';
import Contract from '../models/Contract';
import { IContract } from '../models/Contract';
import logger from '../config/logger';

/**
 * GET all contracts
 */
export const getContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    // Fetch all, then slice for pagination
    const allContracts = await contractService.getAllContracts();
    const contracts = allContracts.slice(skip, skip + limit);
    const total = allContracts.length;

    res.status(200).json({ contracts, total });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contracts', error });
    return;
  }
};

/**
 * GET contract by ID
 */
export const getContractByID = async (req: Request, res: Response): Promise<void> => {
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

/**
 * POST create a new contract
 */
export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      console.log('Unauthorized access attempt: No user found in request.');
      res.status(401).json({ message: 'Unauthorized: No user found in request' });
      return;
    }

    const adminId = req.user._id;
    const contractData: Partial<IContract> = {
      ...req.body,
      admin: adminId,
    };

    console.log('Processed Contract Data (including admin ID):', JSON.stringify(contractData, null, 2));
    const newContract = await contractService.createContract(contractData);
    console.log('Newly Created Contract:', JSON.stringify(newContract, null, 2));

    res.status(201).json(newContract);
    return;
  } catch (error) {
    console.error('Error Creating Contract:', error);
    res.status(500).json({ message: 'Failed to create contract', error });
    return;
  }
};

/**
 * PUT update an existing contract
 */
export const updateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const contractId = req.params.id;
    logger.info(`Received request to update contract with ID: ${contractId}`);
    logger.debug('Request Body: %o', req.body);

    const updateData: Partial<IContract> = { ...req.body };
    logger.debug('Update Data to Apply: %o', updateData);

    const updatedContract = await contractService.updateContract(contractId, updateData);
    if (!updatedContract) {
      logger.warn(`Contract with ID ${contractId} not found.`);
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    logger.info(`Contract with ID ${contractId} successfully updated.`);
    logger.debug('Updated Contract Data: %o', updatedContract);

    res.status(200).json(updatedContract);
    return;
  } catch (error) {
    logger.error('Error updating contract: %o', error);
    res.status(500).json({ message: 'Failed to update contract', error });
    return;
  }
};

/**
 * DELETE contract by ID
 */
export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await contractService.deleteContract(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    res.status(204).send();
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete contract', error });
    return;
  }
};

/**
 * PUT accept contract
 */
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
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept contract', error });
    return;
  }
};

/**
 * PUT decline contract
 */
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
    contract.contractorResponse = { response: 'Declined', notes: reason || '' };
    await contract.save();

    res.json({ message: 'Contract declined successfully', contract });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline contract', error });
    return;
  }
};

/**
 * PUT update contract status
 */
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
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contract status', error });
    return;
  }
};

/**
 * GET contracts by contractor ID
 */
export const getContractsByContractor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractorId } = req.params;
    const contracts = await contractService.getContractsByContractor(contractorId);

    res.status(200).json(contracts);
    return;
  } catch (error) {
    console.error('Error fetching contracts by contractor:', error);
    res.status(500).json({ message: 'Failed to fetch contracts by contractor', error });
    return;
  }
};
