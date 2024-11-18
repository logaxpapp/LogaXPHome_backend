// src/controllers/permissionController.ts

import { Request, Response } from 'express';
import {
  createPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
} from '../services/permissionService';

export const createPermissionHandler = async (req: Request, res: Response) => {
  try {
    const permission = await createPermission(req.body);
    res.status(201).json({ message: 'Permission created successfully', permission });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error creating permission' });
  }
};

export const getAllPermissionsHandler = async (req: Request, res: Response) => {
  try {
    const permissions = await getAllPermissions();
    res.status(200).json(permissions);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching permissions' });
  }
};

export const updatePermissionHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const permission = await updatePermission(id, req.body);
    res.status(200).json({ message: 'Permission updated successfully', permission });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error updating permission' });
  }
};

export const deletePermissionHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deletePermission(id);
    res.status(200).json({ message: 'Permission deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting permission' });
  }
};
