// File: src/controller/authController.js

const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT token 
const generateToken = (user) => {
  return jwt.sign(
    { uid: user.localId || user.uid, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Send OTP using Firebase Auth REST API with Web API Key
exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Firebase Auth REST API for sending verification code
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const data = {
      phoneNumber,
      // Using a "zero-trust" approach without reCAPTCHA
      // This sends SMS without requiring reCAPTCHA verification
      autoRetrievalInfo: {
        appSignatureHash: "FIREBASE_APP_HASH" // Replace with your app hash in a production environment
      }
    };

    const response = await axios.post(url, data);

    // Return the session info which will be needed for verification
    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      sessionInfo: response.data.sessionInfo
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

// Verify OTP and check if user exists using Firebase Auth REST API
exports.verifyOTP = async (req, res) => {
  try {
    const { sessionInfo, code } = req.body;
    
    if (!sessionInfo || !code) {
      return res.status(400).json({ success: false, message: 'Session info and verification code are required' });
    }

    // Firebase Auth REST API for verifying OTP
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const data = {
      sessionInfo,
      code
    };

    const response = await axios.post(url, data);
    
    // Get user details from the response
    const { idToken, localId } = response.data;
    
    // Check if this user has an email (exists in our system)
    // Firebase Auth REST API to get user data
    const userInfoUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const userInfoResponse = await axios.post(userInfoUrl, {
      idToken
    });
    
    const users = userInfoResponse.data.users;
    const userExists = users && users[0] && users[0].email;
    
    if (userExists) {
      // User exists, generate JWT token
      const userData = users[0];
      const jwtToken = generateToken(userData);
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified and user exists',
        token: jwtToken,
        firebaseToken: idToken, // Might be needed for some Firebase operations
        userExists: true,
        user: {
          uid: userData.localId,
          email: userData.email,
          phoneNumber: userData.phoneNumber
        }
      });
    } else {
      // User doesn't exist or doesn't have an email yet
      // We still provide a temporary token with limited claims
      const tempUserData = { localId, phoneNumber: response.data.phoneNumber };
      const tempToken = generateToken(tempUserData);
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified but user registration needed',
        token: tempToken,
        firebaseToken: idToken,
        userExists: false,
        user: {
          uid: localId,
          phoneNumber: response.data.phoneNumber
        }
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

// Register new user with email after OTP verification
exports.registerUser = async (req, res) => {
  try {
    const { firebaseToken, email } = req.body;
    
    if (!firebaseToken || !email) {
      return res.status(400).json({ success: false, message: 'Firebase token and email are required' });
    }

    // Update user profile with email
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const data = {
      idToken: firebaseToken,
      email,
      returnSecureToken: true
    };

    const response = await axios.post(url, data);
    
    // Get updated user info
    const userInfoUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const userInfoResponse = await axios.post(userInfoUrl, {
      idToken: response.data.idToken
    });
    
    const userData = userInfoResponse.data.users[0];
    
    // Generate a new JWT token with updated user info
    const jwtToken = generateToken(userData);

    // Here you would also save the user to your Supabase/Postgres database
    // For now just returning success with the new token

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      token: jwtToken,
      firebaseToken: response.data.idToken,
      user: {
        uid: userData.localId,
        email: userData.email,
        phoneNumber: userData.phoneNumber
      }
    });
  } catch (error) {
    console.error('Error registering user:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.response?.data?.error?.message || error.message 
    });
  }
};