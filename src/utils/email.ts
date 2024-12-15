// src/utils/sendEmail.ts

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { EmailOptions } from '../types/email'; // Importing the interface
import { IUser } from '../models/User'; // Importing the IUser interface
import { IShift } from '../models/Shift';
import { NOTIFICATION_DAYS_BEFORE } from '../config/constants';

dotenv.config();

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail password or App Password
  },
  connectionTimeout: 30000, // Increase timeout to 30 seconds
});

/**
 * Sends an email using the specified options.
 * @param options - The email options.
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Sender address
    to: options.to,                                         // Recipient address
    subject: options.subject,                               // Subject line
    text: options.text,                                     // Plain text body
    html: options.html,                                     // HTML body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to} with subject "${options.subject}"`);
  } catch (error: any) {
    console.error(`Failed to send email to ${options.to}:`, {
      error: error.message || error,
      stack: error.stack,
      subject: options.subject,
    });
    // Do NOT throw the error to prevent it from affecting main operations
    // Optionally, log this incident to a monitoring service or database
  }
};

/**
 * Sends an email verification for user creation.
 * @param to - Recipient's email address.
 * @param token - Verification token.
 */
export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${token}`;

  const options: EmailOptions = {
    to,
    subject: 'Verify Your Email',
    text: `Please verify your email by clicking the following link: ${verificationLink}`,
    html: `<p>Please verify your email by clicking <a href="${verificationLink}">here</a>.</p>`,
  };

  await sendEmail(options);
};

/**
 * Sends account deletion notifications based on status.
 * @param to - Recipient's email address.
 * @param status - Status of the deletion request ('approved' or 'rejected').
 */
export const sendAccountDeletionNotification = async (to: string, status: string): Promise<void> => {
  let subject = '';
  let text = '';
  let html = '';

  if (status === 'approved') {
    subject = 'Your Account Has Been Deleted';
    text = `Hello,\n\nYour account has been successfully deleted.`;
    html = `<p>Your account has been successfully deleted.</p>`;
  } else if (status === 'rejected') {
    subject = 'Account Deletion Request Rejected';
    text = `Hello,\n\nYour request to delete your account has been rejected.`;
    html = `<p>Your request to delete your account has been rejected.</p>`;
  } else {
    throw new Error('Invalid status for account deletion notification.');
  }

  const options: EmailOptions = {
    to,
    subject,
    text,
    html,
  };

  await sendEmail(options);
};

/**
 * Sends an invitation email for user signup.
 * @param to - Recipient's email address.
 * @param token - Invitation token.
 */
export const sendInvitationEmail = async (to: string, token: string): Promise<void> => {
  const inviteLink = `http://localhost:5173/setup-account?token=${token}`;

  const options: EmailOptions = {
    to,
    subject: 'You are Invited to Join Our Platform',
    text: `You have been invited to join our platform. Please set up your account by clicking the following link: ${inviteLink}`,
    html: `<p>You have been invited to join our platform. Please set up your account by clicking <a href="${inviteLink}">here</a>.</p>`,
  };

  await sendEmail(options);
};

/**
 * Sends a password reset email.
 * @param to - Recipient's email address.
 * @param token - Password reset token.
 */
export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetLink = `http://localhost:5000/api/auth/reset-password?token=${token}`;

  const options: EmailOptions = {
    to,
    subject: 'Reset Your Password',
    text: `You can reset your password by clicking the following link: ${resetLink}`,
    html: `<p>You can reset your password by clicking <a href="${resetLink}">here</a>.</p>`,
  };

  await sendEmail(options);
};

/**
 * Notifies all admins of a user's account deletion request.
 * @param user - The user requesting account deletion.
 */
export const notifyAdminsOfDeletionRequest = async (user: IUser): Promise<void> => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim());
  if (!adminEmails || adminEmails.length === 0) {
    console.warn('No admin emails found to send notifications.');
    return;
  }

  const options: EmailOptions = {
    to: adminEmails.join(','), // Joining emails into a comma-separated string
    subject: `Account Deletion Requested for ${user.name}`,
    text: `User ${user.name} (${user.email}) has requested account deletion. Please review and approve the request.`,
    html: `<p>User <strong>${user.name}</strong> (${user.email}) has requested account deletion. Please review and approve the request.</p>`,
  };

  try {
    await sendEmail(options);
    console.log(`Deletion request notification sent to admins for user ${user.email}`);
  } catch (error: any) {
    console.error('Error sending deletion request notification to admins:', error);
  }
};

/**
 * Notifies a user that their account deletion request has been rejected.
 * @param user - The user whose deletion request was rejected.
 */
export const notifyUserDeletionRejection = async (user: IUser): Promise<void> => {
  if (!user.email) {
    console.warn(`User ${user._id} does not have an email to notify.`);
    return;
  }

  const options: EmailOptions = {
    to: user.email,
    subject: 'Your Account Deletion Request has been Rejected',
    text: `Hello ${user.name},\n\nYour request to delete your account has been rejected. If you have any questions, please contact support.\n\nBest regards,\nSupport Team`,
    html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your request to delete your account has been rejected. If you have any questions, please contact support.</p><p>Best regards,<br/>Support Team</p>`,
  };

  await sendEmail(options);
};

/**
 * Notifies a user that their account has been deleted by an admin.
 * @param user - The user whose account has been deleted.
 */
export const notifyUserAccountDeleted = async (user: IUser): Promise<void> => {
  if (!user.email) {
    console.warn(`User ${user._id} does not have an email to notify.`);
    return;
  }

  const options: EmailOptions = {
    to: user.email,
    subject: 'Your Account has been Deleted',
    text: `Hello ${user.name},\n\nYour account has been deleted by an administrator. If you believe this is a mistake, please contact support.\n\nBest regards,\nSupport Team`,
    html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your account has been deleted by an administrator. If you believe this is a mistake, please contact support.</p><p>Best regards,<br/>Support Team</p>`,
  };

  await sendEmail(options);
};

/**
 * (Optional) Notifies a user that their account deletion request has been approved.
 * @param user - The user whose deletion request was approved.
 */
export const notifyUserDeletionApproval = async (user: IUser): Promise<void> => {
  if (!user.email) {
    console.warn(`User ${user._id} does not have an email to notify.`);
    return;
  }

  const options: EmailOptions = {
    to: user.email,
    subject: 'Your Account Deletion Request has been Approved',
    text: `Hello ${user.name},\n\nYour request to delete your account has been approved and your account has been deleted. If you have any questions, please contact support.\n\nBest regards,\nSupport Team`,
    html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your request to delete your account has been approved and your account has been deleted. If you have any questions, please contact support.</p><p>Best regards,<br/>Support Team</p>`,
  };

  await sendEmail(options);
};

/**
 * Sends a notification to all admins when a user signs up.
 * @param user - The user who signed up.
 */

// Send Shift Assignment Notification
export const sendShiftAssignmentNotification = async (user: IUser, shift: IShift, action: 'Assigned' | 'Approved' | 'Rejected'): Promise<void> => {
  let subject = '';
  let text = '';
  let html = '';

  switch(action) {
    case 'Assigned':
      subject = 'You have been assigned a new shift';
      text = `Hello ${user.name},\n\nYou have been assigned a new shift on ${shift.date.toDateString()} from ${shift.startTime} to ${shift.endTime}.`;
      html = `<p>Hello ${user.name},</p><p>You have been assigned a new shift on <strong>${shift.date.toDateString()}</strong> from <strong>${shift.startTime}</strong> to <strong>${shift.endTime}</strong>.</p>`;
      break;
    case 'Approved':
      subject = 'Your shift assignment has been approved';
      text = `Hello ${user.name},\n\nYour shift on ${shift.date.toDateString()} from ${shift.startTime} to ${shift.endTime} has been approved by the administrator.`;
      html = `<p>Hello ${user.name},</p><p>Your shift on <strong>${shift.date.toDateString()}</strong> from <strong>${shift.startTime}</strong> to <strong>${shift.endTime}</strong> has been approved by the administrator.</p>`;
      break;
    case 'Rejected':
      subject = 'Your shift assignment has been rejected';
      text = `Hello ${user.name},\n\nYour shift request on ${shift.date.toDateString()} from ${shift.startTime} to ${shift.endTime} has been rejected by the administrator.`;
      html = `<p>Hello ${user.name},</p><p>Your shift request on <strong>${shift.date.toDateString()}</strong> from <strong>${shift.startTime}</strong> to <strong>${shift.endTime}</strong> has been rejected by the administrator.</p>`;
      break;
    default:
      throw new Error('Invalid action for shift notification');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a password expiry reminder email to the user.
 * @param to - Recipient's email address.
 * @param name - Recipient's name.
 */
export const sendPasswordExpiryReminder = async (to: string, name: string): Promise<void> => {
  const options: EmailOptions = {
    to,
    subject: 'Your password will expire soon',
    text: `Hello ${name},\n\nYour password will expire in less than ${NOTIFICATION_DAYS_BEFORE} days. Please change your password to continue accessing our services without interruption.\n\nBest regards,\nSupport Team`,
    html: `<p>Hello ${name},</p><p>Your password will expire in less than <strong>${NOTIFICATION_DAYS_BEFORE}</strong> days. Please <a href="http://yourapp.com/change-password">change your password</a> to continue accessing our services without interruption.</p><p>Best regards,<br/>Support Team</p>`,
  };

  await sendEmail(options);
};


export const sendResourceNotification = async (to: string, resourceTitle: string) => {
  const options = {
    to,
    subject: `New Resource: ${resourceTitle}`,
    text: `A new resource "${resourceTitle}" has been assigned to you. Please review and acknowledge.`,
    html: `<p>A new resource <strong>${resourceTitle}</strong> has been assigned to you. Please <a href="http://yourapp.com/resources/${resourceTitle}">review and acknowledge</a>.</p>`,
  };

  await sendEmail(options);
};


/**
 * Sends an email using the specified options.
 * @param options - The email options.
 */
export const sendEmailChangeMail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Sender address
    to: options.to,                                         // Recipient address
    subject: options.subject,                               // Subject line
    text: options.text,                                     // Plain text body
    html: options.html,                                     // HTML body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to} with subject "${options.subject}"`);
  } catch (error: any) {
    console.error(`Failed to send email to ${options.to}:`, {
      error: error.message || error,
      stack: error.stack,
      subject: options.subject,
    });
    // Do NOT throw the error to prevent it from affecting main operations
    // Optionally, log this incident to a monitoring service or database
  }
};
