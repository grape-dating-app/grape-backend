// File: src/controller/authController.js

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User, userSchema } = require('../models/userModel');
const emailService = require('../utils/emailService');
require('dotenv').config();

// Generate JWT token 
const generateToken = (user) => {
  return jwt.sign(
    { 
      uid: user.id || user.localId || user.uid,
      email: user.email,
      phone: user.phone_number,
      isProfileComplete: !!user.first_name, // Check if basic profile is complete
      isEmailVerified: !!user.email_verified
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Send OTP using Firebase Auth REST API with Web API Key
exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Check if user exists with this phone number
    const existingUser = await User.findByPhone(phoneNumber);
    
    // Firebase Auth REST API for sending verification code
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const data = {
      phoneNumber
    };

    const response = await axios.post(url, data);

    // Return the session info which will be needed for verification
    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      sessionInfo: response.data.sessionInfo,
      userExists: !!existingUser
    });
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP', 
      error: error.response?.data?.error?.message || error.message 
    });
  }
};

// Verify OTP and check if user exists
exports.verifyOTP = async (req, res) => {
  try {
    const { sessionInfo, code } = req.body;
    
    if (!sessionInfo || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session info and verification code are required' 
      });
    }

    // Firebase Auth REST API for verifying OTP
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const data = {
      sessionInfo,
      code
    };

    const response = await axios.post(url, data);
    const { phoneNumber } = response.data;
    
    // Check if user exists in our database
    const existingUser = await User.findByPhone(phoneNumber);
    
    if (existingUser) {
      // User exists, generate JWT token
      const jwtToken = generateToken(existingUser);
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified and user exists',
        token: jwtToken,
        firebaseToken: response.data.idToken,
        userExists: true,
        user: existingUser
      });
    } else {
      // User doesn't exist, provide a temporary token
      const tempToken = generateToken({ 
        phone_number: phoneNumber,
        isProfileComplete: false,
        isEmailVerified: false
      });
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified but registration needed',
        token: tempToken,
        firebaseToken: response.data.idToken,
        userExists: false,
        phoneNumber
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'OTP verification failed', 
      error: error.response?.data?.error?.message || error.message 
    });
  }
};

// Send email verification OTP
exports.sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const phoneNumber = req.user.phone; // From JWT token

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if email is already registered
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Send verification email
    await emailService.sendVerificationEmail(email);

    return res.status(200).json({
      success: true,
      message: 'Email verification code sent successfully'
    });
  } catch (error) {
    console.error('Error sending email verification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send email verification', 
      error: error.message 
    });
  }
};

// Verify email OTP and start registration
exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const phoneNumber = req.user.phone;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Verify the email OTP
    const isValid = emailService.verifyEmailOTP(email, otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Create initial user record with verified email
    const user = await User.createInitial(phoneNumber, email, true);
    
    // Generate new token with user ID
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Email verified and registration started',
      token,
      user
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Email verification failed', 
      error: error.message 
    });
  }
};

// Complete user profile
exports.completeProfile = async (req, res) => {
  try {
    const userId = req.user.uid; // From JWT token
    const profileData = req.body;

    // Update user profile
    const updatedUser = await User.updateProfile(userId, profileData);

    // Generate new token with updated profile status
    const token = generateToken(updatedUser);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Profile update failed', 
      error: error.message 
    });
  }
};

// Update user location
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    await User.updateLocation(userId, latitude, longitude);

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Location update failed', 
      error: error.message 
    });
  }
};