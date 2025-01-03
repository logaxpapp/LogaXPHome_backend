import { Request, Response } from 'express';
import * as contractService from '../services/contractService';
import Contract from '../models/Contract'; // For direct findById usage
import { IContract } from '../models/Contract';
import logger from '../config/logger';

/** GET all contracts */
export const getContracts = async (req: Request, res: Response) => {
  try {
    // Optional: handle pagination via query params: ?skip=0&limit=10
    const skip = parseInt(req.query.skip as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    // If you want to add skip/limit:
    const contracts = await contractService
      .getAllContracts()
      .then((all) => all.slice(skip, skip + limit));

    // If you want to store total, do something like:
    const total = (await contractService.getAllContracts()).length;

    res.status(200).json({ contracts, total });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contracts', error });
  }
};

/** GET contract by ID */
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
/** POST create a new contract */
export const createContract = async (req: Request, res: Response) => {
  try {
    // Ensure we have an admin user in req.user (JWT)
    if (!req.user) {
      console.log('Unauthorized access attempt: No user found in request.');
      res.status(401).json({ message: 'Unauthorized: No user found in request' });
      return;
    }

    const adminId = req.user._id;
    console.log(`Authenticated Admin ID: ${adminId}`);

    // Log the incoming request body
    console.log('Incoming Contract Data:', JSON.stringify(req.body, null, 2));

    // We expect front-end to pass: companyName, contractor, projectName, startDate, etc. + riskSection
    const contractData: Partial<IContract> = {
      ...req.body,
      admin: adminId,
    };

    // Log the processed contract data
    console.log('Processed Contract Data (including admin ID):', JSON.stringify(contractData, null, 2));

    // Create the new contract
    const newContract = await contractService.createContract(contractData);

    // Log the newly created contract
    console.log('Newly Created Contract:', JSON.stringify(newContract, null, 2));

    res.status(201).json(newContract);
    return;
  } catch (error) {
    // Log the error details
    console.error('Error Creating Contract:', error);
    res.status(500).json({ message: 'Failed to create contract', error });
    return;
  }
};

export const updateContract = async (req: Request, res: Response) => {
  try {
    const contractId = req.params.id;

    // Log the incoming data
    logger.info(`Received request to update contract with ID: ${contractId}`);
    logger.debug('Request Body: %o', req.body);

    // Prepare update data
    const updateData: Partial<IContract> = { ...req.body };
    logger.debug('Update Data to Apply: %o', updateData);

    // Perform the update
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

/** DELETE contract by ID */
export const deleteContract = async (req: Request, res: Response) => {
  try {
    const deleted = await contractService.deleteContract(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }
     res.status(204).send(); // No content
      return;
  } catch (error) {
     res.status(500).json({ message: 'Failed to delete contract', error });
     return;
  }
};

/** PUT accept contract */
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

/** PUT decline contract */
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to decline contract', error });
  }
};

/** PUT update contract status */
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

/** GET contracts by contractor ID */
export const getContractsByContractor = async (req: Request, res: Response) => {
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
