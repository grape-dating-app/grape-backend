const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with generalized SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs (in production, use Redis or similar)
const otpStore = new Map();

const emailService = {
  // Send verification email
  sendVerificationEmail: async (email) => {
    const otp = generateOTP();
    
    // Store OTP with timestamp
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Email Verification - Grape Dating App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a154b;">Welcome to Grape Dating App!</h2>
          <p>Your email verification code is:</p>
          <h1 style="color: #4a154b; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <br>
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
      // Add text version for better email client compatibility
      text: `Welcome to Grape Dating App!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    };

    try {
      // Verify SMTP connection before sending
      await transporter.verify();
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  },

  // Verify email OTP
  verifyEmailOTP: (email, otp) => {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      throw new Error('No OTP found for this email');
    }

    // Check if OTP is expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      otpStore.delete(email);
      throw new Error('OTP has expired');
    }

    // Increment attempts
    storedData.attempts += 1;
    
    // Check max attempts (3)
    if (storedData.attempts > 3) {
      otpStore.delete(email);
      throw new Error('Too many attempts. Please request a new OTP');
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    // Clear OTP after successful verification
    otpStore.delete(email);
    return true;
  }
};

module.exports = emailService; 