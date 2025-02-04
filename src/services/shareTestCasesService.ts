// "I want the vital message at all time."
// src/services/shareTestCasesService.ts

import { v4 as uuidv4 } from 'uuid';
import ShareToken from '../models/ShareToken';
import { sendEmail } from '../utils/email'; // your nodemailer logic
import { IUser } from '../models/User';
import { ApplicationType } from '../models/TestCase';

interface CreateTestCaseShareLinkOptions {
  application: ApplicationType;
  recipientEmail: string;
  createdBy?: IUser;     // admin user
  daysValid?: number;    // default = 7
}

export async function createAndSendTestCaseShareToken({
  application,
  recipientEmail,
  createdBy,
  daysValid = 7,
}: CreateTestCaseShareLinkOptions) {
  // 1) Generate random token
  const token = uuidv4();

  // 2) Calculate expiration
  let expiresAt: Date | undefined;
  if (daysValid > 0) {
    expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
  }

  // 3) Store in DB
  await ShareToken.create({
    token,
    application,
    createdBy: createdBy?._id,
    expiresAt,
  });

  // 4) Build the front-end link
  const shareUrl = `${process.env.FRONTEND_URL}/public/testcases-share/${token}`;

  // 5) Compose Email (Subject + Plain text + Styled HTML)
  const subject = `Access to ${application} Test Cases (valid ${daysValid} days)`;

  // Plain text fallback
  const text = `Hello,

You have been granted temporary access to test cases for "${application}" (valid for ${daysValid} day(s)).

Click the link below:

${shareUrl}

Regards,
Admin Team
`;

  // More visually appealing HTML
  //
  // Using inline CSS for cross-client compatibility:
  // - A gradient background with some padding
  // - A semi-transparent content box for "glass" effect
  // - Bright text and a call-to-action link
  const html = `
    <html>
      <body style="
        margin: 0;
        padding: 0;
        background: linear-gradient(45deg, #8a2be2, #ff69b4);
        font-family: Arial, sans-serif;
        color: #ffffff;
        text-align: center;
        ">
        
        <div style="
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        ">
          <!-- Outer container with gradient or background color -->
          <div style="
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(5px);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
          ">
            <h2 style="
              margin-bottom: 20px;
              font-size: 24px;
              color:rgb(9, 9, 9);
            ">
              Access to <span style="color: #ffd700;">${application}</span> Test Cases
            </h2>

            <p style="
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 20px;
              color:rgb(11, 11, 11);
            ">
              Hello,<br/>
              You have been granted <strong>temporary access</strong> 
              to test cases for <em>${application}</em>.<br/>
              This link is valid for <span style="color: #ffd700; font-weight: bold;">${daysValid} day(s)</span>.
            </p>
            
            <a href="${shareUrl}" 
              style="
                display: inline-block;
                background: #ff7fbf;
                color: #fff;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 30px;
                font-size: 16px;
                font-weight: bold;
                margin: 10px 0;
                transition: background 0.3s ease;
              "
              onmouseover="this.style.background='#ff99cc'"
              onmouseout="this.style.background='#ff7fbf'"
            >
              View Test Cases
            </a>

            <p style="
              margin-top: 30px;
              font-size: 14px;
              line-height: 1.4;
              color:rgb(21, 20, 20);
            ">
              If you did not request this access, you can ignore this email.
            </p>
            
            <hr style="border: none; height: 1px; background: #ffffff40; margin: 20px 0;" />

            <p style="
              font-size: 14px;
              color:rgb(17, 17, 17);
            ">
              Regards,<br/>
              <strong>Admin Team</strong>
            </p>
          </div> <!-- end translucent container -->
        </div> <!-- end outer wrapper -->
      </body>
    </html>
  `;

  // 6) Send the email
  await sendEmail({ to: recipientEmail, subject, text, html });

  // Debug/log
  console.log(`Share token for app ${application} emailed to ${recipientEmail}`);
}
