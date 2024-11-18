// src/controllers/admin/shiftTypeController.ts

import { Request, Response } from 'express';
import {
  createShiftType,
  getAllShiftTypes,
  updateShiftType,
  deleteShiftType,
} from '../../services/shiftService';
import { ShiftTypeName } from '../../models/ShiftType';

// Create a new Shift Type
export const createShiftTypeHandler = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Shift type name is required' });
      return;
    }

    // Validate name against ShiftTypeName enum
    if (!Object.values(ShiftTypeName).includes(name)) {
      res.status(400).json({ message: 'Invalid shift type name' });
      return;
    }

    const shiftType = await createShiftType(name, description);
    res.status(201).json({ shiftType });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to create shift type' });
  }
};

// Get all Shift Types
export const getShiftTypesHandler = async (req: Request, res: Response) => {
  try {
    const shiftTypes = await getAllShiftTypes();
    res.status(200).json({ shiftTypes });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to get shift types' });
  }
};

// Update a Shift Type
export const updateShiftTypeHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.name && !Object.values(ShiftTypeName).includes(updates.name)) {
      res.status(400).json({ message: 'Invalid shift type name' });
      return;
    }

    const updatedShiftType = await updateShiftType(id, updates);
    res.status(200).json({ shiftType: updatedShiftType });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to update shift type' });
  }
};

// Delete a Shift Type
export const deleteShiftTypeHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteShiftType(id);
    res.status(200).json({ message: 'Shift type deleted successfully' });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Failed to delete shift type' });
  }
};
