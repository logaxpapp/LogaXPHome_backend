import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Replace with your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email verification for user creation
export const sendVerificationEmail = async (to: string, token: string): Promise<void> => {
  const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verify Your Email',
    html: `<p>Please verify your email by clicking <a href="${verificationLink}">here</a>.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

// Send account deletion notifications
export const sendAccountDeletionNotification = async (to: string, status: string): Promise<void> => {
  let subject = '';
  let html = '';

  if (status === 'approved') {
    subject = 'Your Account Has Been Deleted';
    html = `<p>Your account has been successfully deleted.</p>`;
  } else if (status === 'rejected') {
    subject = 'Account Deletion Request Rejected';
    html = `<p>Your request to delete your account has been rejected.</p>`;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

// New: Send an invitation email for user signup
export const sendInvitationEmail = async (to: string, token: string): Promise<void> => {
  const inviteLink = `http://localhost:5000/api/auth/setup-account?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'You are Invited to Join Our Platform',
    html: `<p>You have been invited to join our platform. Please set up your account by clicking <a href="${inviteLink}">here</a>.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetLink = `http://localhost:5000/api/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Reset Your Password',
    html: `<p>You can reset your password by clicking <a href="${resetLink}">here</a>.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

