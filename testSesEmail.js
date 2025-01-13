require('dotenv').config(); // if using a .env file
const nodemailer = require('nodemailer');

async function main() {
  // 1) Create transporter with Amazon SES SMTP details
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com', // or your AWS region's endpoint
    port: 465,       // or 587 for STARTTLS
    secure: true,    // true for port 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,  // e.g. AKIA4Mxyz...
      pass: process.env.EMAIL_PASS,  // e.g. BCYB5Pk-----------
    },
  });

  // 2) Define mail options
  const mailOptions = {
    from: '"LogaXP" <support.logaxp.com>', 
      // Make sure this "from" address is *verified* in SES 
      // if you’re still in the SES sandbox.
    to: 'krissbajo@gmail.com',  
      // If you're in the sandbox, this must be a verified address too.
    subject: 'Test Email via Amazon SES SMTP',
    text: 'Hello from Amazon SES SMTP! This is a plain text body.',
    html: '<p>Hello from <strong>Amazon SES SMTP!</strong></p>',
  };

  // 3) Send the email
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Invoke the async function
main();
