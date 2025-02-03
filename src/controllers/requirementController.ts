// "I want the vital message at all time."
// src/controllers/requirementController.ts

import { Request, Response } from 'express';
import {
  createRequirement,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
} from '../services/requirementService';

export async function createRequirementController(req: Request, res: Response) {
  try {
    if (!req.user?._id) {
       res.status(401).json({ message: 'No user logged in' });
       return;
    }

    // Ensure 'application' is present (since it's required in the model).
    if (!req.body.application) {
       res.status(400).json({ message: 'application field is required.' });
       return;
    }

    const data = {
      ...req.body,
      createdBy: req.user._id,
    };

    const newReq = await createRequirement(data);
     res.status(201).json(newReq);
     return;
  } catch (err: any) {
    console.error('Error creating requirement:', err);
     res.status(400).json({ message: err.message });
        return
  }
}

export async function getAllRequirementsController(req: Request, res: Response) {
  try {
    // If you want to allow filtering by application:
    const { application } = req.query;
    const options = { application: application ? String(application) : undefined };

    const requirements = await getAllRequirements(options);
     res.status(200).json({ requirements });
        return;
  } catch (err) {
    console.error('Error fetching requirements:', err);
     res.status(400).json({ message: 'Error fetching requirements' });
        return;
  }
}

export async function getRequirementByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const reqDoc = await getRequirementById(id);
    if (!reqDoc) {
       res.status(404).json({ message: 'Requirement not found' });
    }
     res.status(200).json(reqDoc);
        return
  } catch (err) {
    console.error('Error fetching requirement:', err);
     res.status(400).json({ message: 'Error fetching requirement' });
        return;
  }
}

export async function updateRequirementController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // If you require that application cannot change or only certain users can update it,
    // you can handle that logic here. Otherwise, it's up to your business rules.

    const updated = await updateRequirement(id, req.body);
    if (!updated) {
       res.status(404).json({ message: 'Requirement not found or not updated' });
         return;
    }
     res.status(200).json(updated);
      return;
  } catch (err) {
    console.error('Error updating requirement:', err);
     res.status(400).json({ message: 'Error updating requirement' });
      return;
  }
}

export async function deleteRequirementController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Optionally check if user is Admin or the creator
    // if (req.user?.role !== UserRole.Admin) {
    //   return res.status(403).json({ message: 'Must be admin to delete requirement' });
    // }

    const success = await deleteRequirement(id);
    if (!success) {
       res
        .status(404)
        .json({ message: 'Requirement not found or deletion failed' });
        return;
    }
     res.status(200).json({ message: 'Requirement deleted' });
        return;
  } catch (err) {
    console.error('Error deleting requirement:', err);
     res.status(500).json({ message: 'Server error' });
      return;
  }
}
