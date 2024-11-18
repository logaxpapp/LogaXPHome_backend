// src/models/SettingHistory.ts

import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISettingHistory {
  key: string;
  value: string;
  version: number;
  modifiedAt: Date;
  modifiedBy: string; // Reference to User ID or email
}

export interface ISettingHistoryDocument extends Document, ISettingHistory {}

export interface LeanISettingHistory extends ISettingHistory {
  _id: Types.ObjectId;
}

const SettingHistorySchema: Schema = new Schema<ISettingHistory>(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
    version: { type: Number, required: true },
    modifiedAt: { type: Date, required: true, default: Date.now },
    modifiedBy: { type: String, required: true },
  },
  { versionKey: false }
);

const SettingHistory: Model<ISettingHistoryDocument> = mongoose.model<ISettingHistoryDocument>(
  'SettingHistory',
  SettingHistorySchema
);

export default SettingHistory;

