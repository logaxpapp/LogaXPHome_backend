// src/services/permissionService.ts

import Permission, { IPermission } from '../models/Permission';

export const createPermission = async (data: IPermission): Promise<IPermission> => {
  const permission = new Permission(data);
  await permission.save();
  return permission.toObject();
};

export const getAllPermissions = async (): Promise<IPermission[]> => {
  return Permission.find().lean();
};

export const updatePermission = async (
  id: string,
  updates: Partial<IPermission>
): Promise<IPermission | null> => {
  return Permission.findByIdAndUpdate(id, updates, { new: true }).lean();
};

export const deletePermission = async (id: string): Promise<void> => {
  await Permission.findByIdAndDelete(id);
};
