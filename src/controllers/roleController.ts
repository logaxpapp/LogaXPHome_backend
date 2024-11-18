// src/controllers/roleController.ts

import { Request, Response } from 'express';
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from '../services/roleService';
import Permission from '../models/Permission';
import { Types } from 'mongoose';
import { IRole } from '../models/Role';

export const createRoleHandler = async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;

    // Validate that permissions are valid ObjectIds and exist in the database
    if (!Array.isArray(permissions) || permissions.length === 0) {
      res.status(400).json({ message: 'Permissions array is required' });
      return;
    }

    const permissionIds = permissions.map((id: string) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid permission ID: ${id}`);
      }
      return new Types.ObjectId(id);
    });

    // Check if all permission IDs exist in the database
    const existingPermissions = await Permission.find({ _id: { $in: permissionIds } });
    if (existingPermissions.length !== permissionIds.length) {
      res.status(400).json({ message: 'One or more permissions are invalid' });
      return;
    }

    const role = await createRole(name, permissionIds);
    res.status(201).json({ message: 'Role created successfully', role });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error creating role' });
  }
};

export const getAllRolesHandler = async (req: Request, res: Response) => {
  try {
    const roles = await getAllRoles();
    res.status(200).json(roles);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching roles' });
  }
};

export const getRoleByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await getRoleById(id);
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    res.status(200).json(role);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching role' });
  }
};

export const updateRoleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const updates: Partial<IRole> = {};

    if (name) {
      updates.name = name;
    }

    if (permissions) {
      // Validate permissions
      if (!Array.isArray(permissions) || permissions.length === 0) {
        res.status(400).json({ message: 'Permissions array is required' });
        return;
      }

      const permissionIds = permissions.map((id: string) => {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid permission ID: ${id}`);
        }
        return new Types.ObjectId(id);
      });

      // Check if all permission IDs exist in the database
      const existingPermissions = await Permission.find({ _id: { $in: permissionIds } });
      if (existingPermissions.length !== permissionIds.length) {
        res.status(400).json({ message: 'One or more permissions are invalid' });
        return;
      }

      updates.permissions = permissionIds;
    }

    const role = await updateRole(id, updates);
    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }
    res.status(200).json({ message: 'Role updated successfully', role });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error updating role' });
  }
};

export const deleteRoleHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteRole(id);
    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting role' });
  }
};
