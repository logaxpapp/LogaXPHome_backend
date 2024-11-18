// src/models/Setting.ts

import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISetting {
  key: string;
  value: string;
  version: number;
}

export interface ISettingDocument extends Document, ISetting {}

export interface LeanISetting extends ISetting {
  _id: Types.ObjectId;
}

const SettingSchema: Schema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
  },
  { versionKey: false }
);

const Setting: Model<ISettingDocument> = mongoose.model<ISettingDocument>('Setting', SettingSchema);

export default Setting;

