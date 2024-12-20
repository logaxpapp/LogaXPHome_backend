// src/models/Permission.ts

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPermission {
  name: string;
  description?: string;
}

export interface IPermissionDocument extends Document, IPermission {}

const PermissionSchema: Schema = new Schema<IPermission>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { versionKey: false }
);

const Permission: Model<IPermissionDocument> = mongoose.model<IPermissionDocument>(
  'Permission',
  PermissionSchema
);
export default Permission;
