// src/models/Team.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

/**
 * Team Member Interface
 */
export interface ITeamMember {
  user: mongoose.Types.ObjectId | IUser;
  role: 'Leader' | 'Member' | 'Viewer'; // Define roles
}

/**
 * Updated Team Interface
 */
export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId | IUser;
  members: ITeamMember[]; // Updated to include role
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team Member Schema
 */
const TeamMemberSchema: Schema<ITeamMember> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['Leader', 'Member', 'Viewer'],
      default: 'Member',
      required: true,
    },
  },
  { _id: false }
);

/**
 * Updated Team Schema
 */
const TeamSchema: Schema<ITeam> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [TeamMemberSchema], // Use the updated schema
  },
  { timestamps: true }
);

// Optional text index for searching
TeamSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<ITeam>('Team', TeamSchema);
