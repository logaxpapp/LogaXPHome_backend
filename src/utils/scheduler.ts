// src/utils/scheduler.ts

import cron from 'node-cron';
// import { syncEmployeesWithHR } from '../services/hrIntegrationService';
import AppraisalPeriod from '../models/AppraisalPeriod';
import { sendEmail } from './email';
import ApprovalRequestBase, { IApprovalRequestBasePopulated } from '../models/ApprovalRequest';
import mongoose, { model, models } from 'mongoose';
import { IUser } from '../models/User';
import { isIUser } from '../utils/typeGuards';
/**
 * Schedule daily tasks for sending reminders.
 */
export const scheduleDailyReminders = () => {   
  // Runs every day at 8 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Define start and end of tomorrow
      const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
      const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

      // Find appraisal periods with submission deadline tomorrow
      const periods = await AppraisalPeriod.find({
        submissionDeadline: {
          $gte: startOfTomorrow,
          $lte: endOfTomorrow,
        },
      });

      for (const period of periods) {
        // Fetch all approval requests associated with this period and populate 'user'
        const approvalRequests = await ApprovalRequestBase.find({ 'request_data.period': period._id })
          .populate('user', 'email name') // Populates 'user' with 'email' and 'name'
          .exec() as Array<IApprovalRequestBasePopulated>;

        for (const request of approvalRequests) {
          // Ensure 'user' is populated
          if (!isIUser(request.user)) {
            console.warn(`Approval Request ${request._id} has unpopulated user.`);
            continue; // Skip sending email if user is not populated
          }

          await sendEmail({
            to: request.user.email,
            subject: `Reminder: Submit Your Appraisal for ${period.name}`,
            text: `Hello ${request.user.name},\n\nThis is a reminder to submit your appraisal for ${period.name} by ${period.submissionDeadline.toDateString()}.\n\nRegards,\nHR Team`,
            html: `<p>Hello <strong>${request.user.name}</strong>,</p><p>This is a reminder to submit your appraisal for <strong>${period.name}</strong> by <strong>${period.submissionDeadline.toDateString()}</strong>.</p><p>Regards,<br/>HR Team</p>`,
          });
        }

        // Similarly, notify approvers about upcoming review deadlines
        const approverIds = await ApprovalRequestBase.find({ 'request_data.period': period._id })
          .distinct('steps.approver');

        // Fetch approvers' details and populate 'email' and 'name'
        const approvers = await mongoose.model<IUser>('User').find({ _id: { $in: approverIds } })
          .select('email name') // Select only necessary fields
          .exec();

        for (const approver of approvers) {
          await sendEmail({
            to: approver.email,
            subject: `Reminder: Review Appraisal Requests for ${period.name}`,
            text: `Hello ${approver.name},\n\nThis is a reminder to review and approve appraisal requests for ${period.name} by ${period.reviewDeadline.toDateString()}.\n\nRegards,\nHR Team`,
            html: `<p>Hello <strong>${approver.name}</strong>,</p><p>This is a reminder to review and approve appraisal requests for <strong>${period.name}</strong> by <strong>${period.reviewDeadline.toDateString()}</strong>.</p><p>Regards,<br/>HR Team</p>`,
          });
        }
      }
    } catch (error) {
      console.error('Error in scheduled reminders:', error);
    }
  });
};

// /**
//  * Schedule daily tasks.
//  */
// export const scheduleDailyTasks = () => {
//   // Schedule employee syncing every day at 2 AM
//   cron.schedule('0 2 * * *', async () => {
//     try {
//       await syncEmployeesWithHR();
//       console.log('Employee synchronization with HR completed successfully.');
//     } catch (error) {
//       console.error('Error syncing employees with HR:', error);
//     }
//   });

//   // Schedule reminders
//   scheduleDailyReminders();
// };
