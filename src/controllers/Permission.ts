import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  description?: string;
}

const PermissionSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
});

const Permission: Model<IPermission> = mongoose.model<IPermission>('Permission', PermissionSchema);
export default Permission;
