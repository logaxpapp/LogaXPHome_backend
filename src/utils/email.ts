// src/utils/email.ts

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { EmailOptions } from '../types/email'; // Importing the interface
import { IUser } from '../models/User'; // Importing the IUser interface
import { IShift } from '../models/Shift';
import { IReference } from '../models/Reference';
import { IReferee } from '../models/Referee';
import { NOTIFICATION_DAYS_BEFORE } from '../config/constants';

dotenv.config();

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  //host: 'email-smtp.us-east-1.amazonaws.com', // or another region's endpoint
  service: 'gmail', // e.g. 'gmail' for Google Workspace
  //port: 465,         // or 587
  //secure: true,      // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,  // e.g. AKIA4MTWGW2DYKBBCAN5
    pass: process.env.EMAIL_PASS,  // e.g. BCYB5Pk-----------
  },
  connectionTimeout: 30000, // 30 seconds
});


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

export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verificationLink = `${process.env.BACKEND_URL}/auth/verify-email?token=${token}`;

  const options: EmailOptions = {
    to,
    subject: 'Verify Your Email',
    text: `Hello,

Please verify your email by clicking the following link: ${verificationLink}

Best regards,
Support Team`,
    html: `<p>Please verify your email by clicking <a href="${verificationLink}">here</a>.</p>`,
  };

  await sendEmail(options);
};



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


export const sendInvitationEmail = async (to: string, token: string): Promise<void> => {
  const inviteLink = `${process.env.FRONTEND_URL}/setup-account?token=${token}`;

  const options: EmailOptions = {
    to,
    subject: 'You are Invited to Join Our Platform',
    text: `Hello,

You have been invited to join our platform. Please set up your account by clicking the following link: ${inviteLink}

Best regards,
Support Team`,
    html: `<p>You have been invited to join our platform. Please set up your account by clicking <a href="${inviteLink}">here</a>.</p>`,
  };

  await sendEmail(options);
};

export const passwordResetEmail = async (to: string, token: string): Promise<void> => {
  // Correctly point to the frontend where users can reset their password
  const resetLink = `${process.env.BACKEND_URL}/auth/reset-password?token=${token}`;

  const options: EmailOptions = {
    to,
    subject: 'Reset Your Password',
    text: `Hello,

You can reset your password by clicking the following link: ${resetLink}

If you did not request a password reset, please ignore this email.

Best regards,
Support Team`,
    html: `<p>You can reset your password by clicking <a href="${resetLink}">here</a>.</p>`,
  };

  await sendEmail(options);
};



export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetLink = `${process.env.BACKEND_URL}/auth/reset-password?token=${token}`;

  const options: EmailOptions = {
    to,
    subject: 'Reset Your Password',
    text: `Hello,

You can reset your password by clicking the following link: ${resetLink}

If you did not request a password reset, please ignore this email.

Best regards,
Support Team`,
    html: `<p>You can reset your password by clicking <a href="${resetLink}">here</a>.</p>`,
  };

  await sendEmail(options);
};


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

export const sendPasswordExpiryReminder = async (to: string, name: string): Promise<void> => {
  const changePasswordLink = `${process.env.FRONTEND_URL}/change-password`;

  const options: EmailOptions = {
    to,
    subject: 'Your password will expire soon',
    text: `Hello ${name},

Your password will expire in less than ${NOTIFICATION_DAYS_BEFORE} days. Please change your password to continue accessing our services without interruption.

Best regards,
Support Team`,
    html: `<p>Hello ${name},</p>
           <p>Your password will expire in less than <strong>${NOTIFICATION_DAYS_BEFORE}</strong> days. Please <a href="${changePasswordLink}">change your password</a> to continue accessing our services without interruption.</p>
           <p>Best regards,<br/>Support Team</p>`,
  };

  await sendEmail(options);
};



export const sendResourceNotification = async (to: string, resourceTitle: string): Promise<void> => {
  const resourceLink = `${process.env.FRONTEND_URL}/resources/${encodeURIComponent(resourceTitle)}`;

  const options: EmailOptions = {
    to,
    subject: `New Resource: ${resourceTitle}`,
    text: `Hello,

A new resource "${resourceTitle}" has been assigned to you. Please review and acknowledge by visiting: ${resourceLink}

Best regards,
Support Team`,
    html: `<p>A new resource <strong>${resourceTitle}</strong> has been assigned to you. Please <a href="${resourceLink}">review and acknowledge</a>.</p>`,
  };

  await sendEmail(options);
};


export const sendConfirmationEmail = async (to: string, token: string): Promise<void> => {
  const confirmationUrl = `${process.env.FRONTEND_URL}/newsletter/confirm/${token}`;
  const mailOptions: EmailOptions = {
    to,
    subject: 'Confirm Your Newsletter Subscription',
    text: `Thank you for subscribing! Please confirm your subscription by clicking the following link: ${confirmationUrl}`,
    html: `
      <h1>Thank you for subscribing!</h1>
      <p>Please confirm your subscription by clicking the link below:</p>
      <a href="${confirmationUrl}">Confirm Subscription</a>
      <p>If you did not subscribe, please ignore this email.</p>
    `,
  };

  await sendEmail(mailOptions);
};


export const sendUnsubscribeConfirmationEmail = async (to: string): Promise<void> => {
  const unsubscribeUrl = `${process.env.FRONTEND_URL}/newsletter/subscribe`;
  
  const mailOptions: EmailOptions = {
    to,
    subject: 'You have unsubscribed from our Newsletter',
    text: `You have successfully unsubscribed from our newsletter. We're sorry to see you go! If this was a mistake, you can subscribe again by visiting our website.`,
    html: `
      <h1>Unsubscription Confirmed</h1>
      <p>You have successfully unsubscribed from our newsletter. We're sorry to see you go!</p>
      <p>If this was a mistake, you can <a href="${unsubscribeUrl}">subscribe again</a>.</p>
    `,
  };

  await sendEmail(mailOptions);
};



export const sendNewsletterEmail = async (
  to: string,
  subject: string,
  content: string
): Promise<void> => {
  const mailOptions: EmailOptions = {
    to,
    subject,
    text: `You have received a new newsletter. Please view it in an HTML-compatible email client.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${content}
      </div>
    `,
  };

  await sendEmail(mailOptions);
};

export async function sendReferenceEmail(reference: IReference): Promise<void> {
  // Because we populated 'referee' and 'applicant', we can safely cast them:
  const referee = reference.referee as IReferee;
  const applicant = reference.applicant as { name: string; email?: string };

  // Log some details to confirm we have the data
  console.log('sendReferenceEmail -> referee.email:', referee.email);
  console.log('sendReferenceEmail -> referee.name:', referee.name);
  console.log('sendReferenceEmail -> applicant.name:', applicant.name);
  console.log('sendReferenceEmail -> reference.token:', reference.token);

  // If any required fields are missing, throw
  if (!referee.email || !referee.name || !applicant.name) {
    console.error('sendReferenceEmail -> Missing fields:', {
      refereeEmail: referee.email,
      refereeName: referee.name,
      applicantName: applicant.name,
    });
    throw new Error('Required fields for email are missing.');
  }

  // Construct the link to the public form:
  const referenceLink = `${process.env.FRONTEND_URL}/fill-reference?token=${reference.token}`;
  console.log('sendReferenceEmail -> referenceLink:', referenceLink);

  // Configure nodemailer transport
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or an alternative email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Compose your email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: referee.email, // might be an array if multiple recipients
    subject: 'Employment Reference Request',
    html: `
      <p>Dear ${referee.name},</p>
      <p>${applicant.name} has requested an employment reference from you.</p>
      <p>Please fill out the reference form by clicking the link below:</p>
      <a href="${referenceLink}">Fill Reference Form</a>
      <p>This link will expire in 7 days.</p>
      <p>Thank you!</p>
    `,
  };

  // Attempt to send
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('sendReferenceEmail -> Email sent successfully:', info);
  } catch (err) {
    console.error('sendReferenceEmail -> Error sending email:', err);
    throw err; // rethrow if you want the caller to see the error
  }
}


export const sendReferenceConfirmationEmail = async (to: string, token: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use any email service provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const confirmationLink = `${process.env.FRONTEND_URL}/confirm-reference?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Reference Submission Confirmation',
    html: `
      <p>Dear User,</p>
      <p>Thank you for completing the reference form.</p>
      <p>You can view the confirmation by clicking the link below:</p>
      <a href="${confirmationLink}">View Confirmation</a>
      <p>Thank you!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Define the shape of the mail options
interface EmailChangeMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends an email regarding a profile change (approval/rejection).
 * Adapt transporter config for your environment/service (Gmail, SMTP, etc.)
 */
export const sendEmailChangeMail = async ({
  to,
  subject,
  text,
  html,
}: EmailChangeMailOptions): Promise<void> => {
  try {
    // 1) Create a transporter. 
    // In production, you might use env variables or a mail service (SendGrid, AWS SES, etc.)
    const transporter = nodemailer.createTransport({
      host: 'smtp.example.com',       // e.g. 'smtp.gmail.com'
      port: 587,                      // or 465 for SSL
      secure: false,                  // true if using 465
      auth: {
        user: 'your_email@example.com',
        pass: 'your_email_password',
      },
    });

    // 2) Define mail options
    const mailOptions = {
      from: '"Admin Team" <no-reply@example.com>', // Adjust "from" address
      to,
      subject,
      text,
      html,
    };

    // 3) Send mail
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${to}, Info:`, info.messageId);
  } catch (error) {
    console.error('Error sending change-request email:', error);
    throw error; // Re-throw so the caller can handle it
  }
};



/**
 * Sends a board invitation email, allowing a new or existing user to accept and join the board.
 * @param to - The invitee's email address
 * @param token - A unique invite token (generated by your invitation service)
 * @param boardName - Optionally include the board name in the email for clarity
 */
export const sendBoardInvitationEmail = async (
  to: string,
  token: string,
  boardName: string = 'your board'
): Promise<void> => {
  // e.g., http://localhost:5173/invite/accept?token=abc123
  const inviteLink = `${process.env.FRONTEND_URL}/invite/accept?token=${encodeURIComponent(token)}`;

  // Example subject and message
  const subject = `You’ve been invited to join ${boardName}`;
  const text = `Hello,
  
You have been invited to join the board "${boardName}". Please accept the invitation by clicking the link below:
${inviteLink}

If you did not request this invitation, you can safely ignore this email.

Best regards,
Support Team
`;

  const html = `
    <p>Hello,</p>
    <p>You have been invited to join the board "<strong>${boardName}</strong>". Please accept the invitation by clicking the link below:</p>
    <p><a href="${inviteLink}">${inviteLink}</a></p>
    <p>If you did not request this invitation, you can safely ignore this email.</p>
    <p>Best regards,<br/>Support Team</p>
  `;

  // Now assemble the EmailOptions as in your other functions
  const options = {
    to,
    subject,
    text,
    html,
  };

  await sendEmail(options);
  console.log(`Board invitation email sent to ${to} for board: ${boardName}`);
};
