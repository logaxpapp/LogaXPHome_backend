import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

export const createAuditLog = async (
  userId: mongoose.Types.ObjectId,
  changedBy: mongoose.Types.ObjectId,
  changes: Record<string, { old: any; new: any }>
) => {
  const auditLog = new AuditLog({
    user: userId,
    changed_by: changedBy,
    changes,
    timestamp: new Date(),
  });
  await auditLog.save();
};
