// src/routes/index.ts

import { Router } from 'express';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import adminRoutes from './adminRoutes';
import userRoutes from './userRoutes';
import ticketRoutes from './ticketRoutes';
import surveyRoutes from './surveyRoutes';
import approvalRoutes from './approvalRoutes';
import appraisalQuestionRoutes from './appraisalQuestionRoutes';
import appraisalMetricRoutes from './appraisalMetricRoutes';
import appraisalPeriodRoutes from './appraisalPeriodRoutes';
import reportRoutes from './reportRoutes';
import adminShiftRoutes from './adminShiftRoutes';
import userShiftRoutes from './userShiftRoutes';
import { refreshTokenMiddleware } from '../middlewares/refreshToken';
import googleRoutes from './googleRoutes';
import payPeriodRoutes from './payPeriodRoutes';
import timeEntryRoutes from './timeEntryRoutes';
import employeePayPeriodRouter from './employeePayPeriodRoutes';
import roleRouter from './roleRoutes';
import settingRoutes from './settingRoutes';
import Permission from './permissionRoutes';
import Resource from './resourceRoutes';
import Incident from './incidentRoutes';
import Support from './supportRoutes';

const router = Router();

// Unprotected Routes
router.use('/auth', authRoutes);
router.use('/google-calendar', googleRoutes);

// Apply authentication middleware globally after unprotected routes
//router.use(refreshTokenMiddleware);

// Protected Routes (all these routes require authentication)
router.use('/logout', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/tickets', ticketRoutes);
router.use('/surveys', surveyRoutes);
router.use('/approvals', approvalRoutes);
router.use('/appraisal-questions', appraisalQuestionRoutes);
router.use('/appraisal-metrics', appraisalMetricRoutes);
router.use('/appraisal-periods', appraisalPeriodRoutes);
router.use('/reports', reportRoutes);
router.use('/admin/shifts', adminShiftRoutes);
router.use('/users/shifts', userShiftRoutes);
router.use('/payperiods', payPeriodRoutes);
router.use('/employee/pay-periods', employeePayPeriodRouter);
router.use('/time-entries', timeEntryRoutes);
router.use('/roles', roleRouter);
router.use('/settings', settingRoutes);
router.use('/permissions', Permission);
router.use('/resources', Resource);
router.use('/incidents', Incident);
router.use('/support', Support);

export default router;
