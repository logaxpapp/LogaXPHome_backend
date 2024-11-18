// src/services/roleService.ts

import Role from '../models/Role';
import {  LeanIPermission } from '../models/Permission';
import { IRole } from '../models/Role';
import { Types } from 'mongoose';

export interface LeanIRole {
    _id: string;
    name: string;
    permissions: LeanIPermission[];
  }
  
  export const createRole = async (
    name: string,
    permissions: Types.ObjectId[]
  ): Promise<LeanIRole> => {
    const role = new Role({ name, permissions });
    await role.save();
  
    const populatedRole = await Role.findById(role._id)
      .populate<{ permissions: LeanIPermission[] }>('permissions')
      .lean()
      .exec();
  
    if (!populatedRole) {
      throw new Error('Failed to find the newly created role.');
    }
  
    return {
      _id: populatedRole._id.toString(),
      name: populatedRole.name,
      permissions: populatedRole.permissions.map((p) => ({
        _id: p._id.toString(), // Now matches LeanIPermission's _id: string
        name: p.name,
        description: p.description,
      })),
    };
  };
  // 
  
  export const getAllRoles = async (): Promise<LeanIRole[]> => {
    const roles = await Role.find()
      .populate<{ permissions: LeanIPermission[] }>({
        path: 'permissions',
        model: 'Permission',
        select: '_id name description',
      })
      .lean()
      .exec();
  
    return roles.map((role) => ({
      _id: role._id.toString(),
      name: role.name,
      permissions: role.permissions.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
      })),
    }));
  };
  
  

  export const getRoleById = async (id: string): Promise<LeanIRole | null> => {
    return Role.findById(id)
      .populate('permissions', '_id name') // Populate with only necessary fields
      .lean()
      .exec()
      .then((role) =>
        role
          ? {
              ...role,
              _id: role._id.toString(),
              permissions: role.permissions.map((p: any) =>
                typeof p === 'object' && p._id ? p._id.toString() : p.toString()
              ),
            }
          : null
      );
  };
  

export const updateRole = async (
    id: string,
    updates: Partial<IRole>
  ): Promise<LeanIRole | null> => {
    return Role.findByIdAndUpdate(id, updates, { new: true })
      .populate('permissions', '_id name') // Populate with only necessary fields
      .lean()
      .exec()
      .then((role) =>
        role
          ? {
              ...role,
              _id: role._id.toString(),
              permissions: role.permissions.map((p: any) =>
                typeof p === 'object' && p._id ? p._id.toString() : p.toString()
              ),
            }
          : null
      );
  };
  

export const deleteRole = async (id: string): Promise<void> => {
  await Role.findByIdAndDelete(id);
};
