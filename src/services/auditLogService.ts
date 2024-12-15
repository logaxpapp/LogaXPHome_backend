// src/services/auditLogService.ts
import AuditLog, { IAuditLog } from '../models/AuditLog';
import mongoose from'mongoose';

/**
 * Create a new audit log entry.
 */
export const createAuditLogService = async (
  user: mongoose.Types.ObjectId,
  changedBy: mongoose.Types.ObjectId,
  changes: Record<string, { old: any; new: any }>
): Promise<IAuditLog> => {
  const auditLog = new AuditLog({
    user,
    changed_by: changedBy,
    changes,
    timestamp: new Date(),
  });
  return await auditLog.save();
};

/**
 * Fetch all audit logs with optional filters (e.g., by user, changed_by).
 */
export const getAuditLogsService = async (
  filters: Partial<{ user: mongoose.Types.ObjectId; changed_by: mongoose.Types.ObjectId }>,
  page: number = 1,
  limit: number = 10
) => {
  const query: any = {};

  if (filters.user) query.user = filters.user;
  if (filters.changed_by) query.changed_by = filters.changed_by;

  const skip = (page - 1) * limit;
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('user', 'name email')
    .populate('changed_by', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ timestamp: -1 })
    .lean();

  return { total, logs, page, pages: Math.ceil(total / limit) };
};
