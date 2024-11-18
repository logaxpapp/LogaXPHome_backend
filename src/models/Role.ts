// src/models/Role.ts

import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IRole {
  name: string;
  permissions: Types.ObjectId[]; // Array of Permission IDs
}

export interface IRoleDocument extends IRole, Document {}

const RoleSchema: Schema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  },
  { versionKey: false }
);

const Role: Model<IRoleDocument> = mongoose.model<IRoleDocument>('Role', RoleSchema);

export default Role;
