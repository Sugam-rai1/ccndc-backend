import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const sendEmail = async ({ to, subject, text }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // Your email address from .env
      pass: process.env.EMAIL_PASS,  // Your email password from .env (or App Password)
    },
  });

  try {
    await transporter.sendMail({
      from: `"CCNDC" <${process.env.EMAIL_USER}>`,  // From address
      to,  // Recipient email address (this is dynamic)
      subject,  // Subject of the email
      text,  // Body of the email
    });
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export default sendEmail;
