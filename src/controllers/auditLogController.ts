// src/controllers/auditLogController.ts
import { Request, Response } from 'express';
import { createAuditLogService, getAuditLogsService } from '../services/auditLogService';
import mongoose from'mongoose';

/**
 * Handler to fetch all audit logs with optional filters.
 */
export const getAuditLogsHandler = async (req: Request, res: Response): Promise<void> => {
  const { user, changed_by, page, limit } = req.query;

  try {
    const result = await getAuditLogsService(
      {
        user: user ? new mongoose.Types.ObjectId(user as string) : undefined,
        changed_by: changed_by ? new mongoose.Types.ObjectId(changed_by as string) : undefined,
      },
      Number(page) || 1,
      Number(limit) || 10
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Create an audit log manually (if needed).
 */
export const createAuditLogHandler = async (req: Request, res: Response): Promise<void> => {
  const { user, changed_by, changes } = req.body;

  try {
    const log = await createAuditLogService(user, changed_by, changes);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
