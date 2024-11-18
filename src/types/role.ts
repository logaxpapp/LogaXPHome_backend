// src/types/role.ts
import { IPermission } from '../models/Permission';

export interface LeanIRole {
  _id: string;
  name: string;
  permissions: IPermission[]; // Populated permissions
}
