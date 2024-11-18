// src/models/Resource.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

// Enum for Resource Types
export enum ResourceType {
  Policy = 'Policy',
  Tutorial = 'Tutorial',
  Documentation = 'Documentation',
  Other = 'Other',
}

export enum Tags {
  Security = 'Security',
  Compliance = 'Compliance',
  Development = 'Development',
  Education = 'Education',
  Marketing = 'Marketing',
}


// Interface for Resource
export interface IResource extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: ResourceType;
  content: string;
  images: string[]; // Paths or URLs to images
  createdBy: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
  tags: Tags[]; // New field for tags
}

// Resource Schema
const ResourceSchema: Schema<IResource> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(ResourceType), required: true },
    tags: [{ type: String, enum: Object.values(Tags) }],
    content: { type: String, required: true },
    images: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual field for related resources based on tags
ResourceSchema.virtual('relatedResources', {
  ref: 'Resource',
  localField: 'tags',
  foreignField: 'tags',
  justOne: false,
});


// Resource Model
const Resource: Model<IResource> = mongoose.model<IResource>('Resource', ResourceSchema);
export default Resource;
