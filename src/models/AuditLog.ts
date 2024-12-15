// src/models/AuditLog.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

export interface IAuditLog extends Document {
  user: mongoose.Types.ObjectId | IUser; // The user whose profile was changed
  changed_by: mongoose.Types.ObjectId | IUser; // The admin who approved the change
  changes: Record<string, { old: any; new: any }>; // Fields that were changed with old and new values
  timestamp: Date;
}

const ChangeDetailSchema = new Schema({
  old: { type: Schema.Types.Mixed },
  new: { type: Schema.Types.Mixed },
});

const AuditLogSchema: Schema<IAuditLog> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changes: {
    type: Map,
    of: ChangeDetailSchema,
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
});

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
