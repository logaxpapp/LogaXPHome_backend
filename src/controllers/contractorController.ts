
import * as contractorService from '../services/contractorService';
import { Request, Response, NextFunction } from 'express';

export const getContractors = async (req: Request, res: Response) => {
  try {
    const contractors = await contractorService.getAllContractors();
    res.status(200).json(contractors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contractors', error });
  }
};

export const getContractorByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contractor = await contractorService.getContractorById(req.params.id);
    
    if (!contractor) {
       res.status(404).json({ message: 'Contractor not found' });
       return;
    }
    
     res.status(200).json(contractor);
     return;
  } catch (error) {
    console.error('Error fetching contractor:', error);
     res.status(500).json({ message: 'Failed to fetch contractor', error });
     return;
  }
};


export const getContractorByme = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Extracted from JWT middleware
    const contractor = await contractorService.getContractorById(userId);
    if (!contractor) {
      res.status(404).json({ message: 'Contractor not found' });
      return;
    }
    res.status(200).json(contractor);
  } catch (error) {
    console.error('Error fetching contractor:', error);
    res.status(500).json({ message: 'Failed to fetch contractor', error });
  }
};

export const updateContractor = async (req: Request, res: Response) => {
  try {
    const updatedContractor = await contractorService.updateContractorDetails(req.params.id, req.body);
    res.status(200).json(updatedContractor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contractor', error });
  }
};
