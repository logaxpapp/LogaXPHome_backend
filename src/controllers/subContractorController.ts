// src/controllers/subContractorController.ts

import { Request, Response } from 'express';
import * as subContractorService from '../services/subContractorService';
import { IUser } from '../models/User';

/**
 * Create a new SubContractor.
 */
export const createSubContractorHandler = async (req: Request, res: Response) => {
  try {
    const managerId = req.user?._id; // Assuming `authenticateJWT` adds `user` to `req`
    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
    }

    const data: Partial<IUser> = req.body;

    // Create SubContractor
    const subContractor = await subContractorService.createSubContractor(managerId.toString(), data);

    res.status(201).json(subContractor);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create SubContractor', error: error.message });
  }
};

/**
 * Get all SubContractors for the authenticated manager.
 */
export const getSubContractorsHandler = async (req: Request, res: Response) => {
  try {
    const managerId = req.user?._id;
    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
    }

    const subContractors = await subContractorService.getSubContractorsByManager(managerId.toString());

    res.status(200).json(subContractors);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch SubContractors', error: error.message });
  }
};

/**
 * Get a specific SubContractor by ID.
 */
export const getSubContractorByIdHandler = async (req: Request, res: Response) => {
  try {
    const managerId = req.user?._id;
    const subContractorId = req.params.id;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
    }

    const subContractor = await subContractorService.getSubContractorById(managerId.toString(), subContractorId);

    if (!subContractor) {
      res.status(404).json({ message: 'SubContractor not found.' });
        return;
    }

    res.status(200).json(subContractor);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch SubContractor', error: error.message });
  }
};

/**
 * Update a SubContractor's details.
 */
export const updateSubContractorHandler = async (req: Request, res: Response) => {
  try {
    const managerId = req.user?._id;
    const subContractorId = req.params.id;
    const updates: Partial<IUser> = req.body;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
        return;
    }

    const updatedSubContractor = await subContractorService.updateSubContractor(managerId.toString(), subContractorId, updates);

    if (!updatedSubContractor) {
      res.status(404).json({ message: 'SubContractor not found or unauthorized.' });
        return;
    }

    res.status(200).json(updatedSubContractor);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update SubContractor', error: error.message });
  }
};

/**
 * Delete a SubContractor.
 */
export const deleteSubContractorHandler = async (req: Request, res: Response) => {
  try {
    const managerId = req.user?._id;
    const subContractorId = req.params.id;

    if (!managerId) {
      res.status(401).json({ message: 'Unauthorized: No user found in request.' });
      return;
    }

    const success = await subContractorService.deleteSubContractor(managerId.toString(), subContractorId);

    if (!success) {
      res.status(404).json({ message: 'SubContractor not found or unauthorized.' });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete SubContractor', error: error.message });
  }
};
