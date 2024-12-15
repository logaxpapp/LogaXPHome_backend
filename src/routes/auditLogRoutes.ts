// src/routes/auditLogRoutes.ts
import express from 'express';
import { getAuditLogsHandler, createAuditLogHandler } from '../controllers/auditLogController';

const router = express.Router();

router.get('/', getAuditLogsHandler); // Fetch all audit logs
router.post('/', createAuditLogHandler); // Create an audit log manually

export default router;
