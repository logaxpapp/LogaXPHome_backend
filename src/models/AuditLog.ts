// src/models/AuditLog.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  requestId: mongoose.Types.ObjectId;
  action: string; // e.g., "approve", "reject", "add_step"
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  comments?: string;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'ApprovalRequest', required: true },
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  comments: { type: String },
});

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
