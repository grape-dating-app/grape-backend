const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Firebase phone number verification
    const verificationId = await admin.auth().createCustomToken(phoneNumber);
    
    res.json({ success: true, verificationId });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login/signup
router.post('/verify-otp', async (req, res) => {
  try {
    const { verificationId, otp } = req.body;
    
    // Verify the OTP with Firebase
    const decodedToken = await admin.auth().verifyIdToken(verificationId);
    const { phone_number } = decodedToken;
    
    // Find or create user
    let [user, created] = await User.findOrCreate({
      where: { phone_number },
      defaults: {
        phone_number,
        // Add other default fields as needed
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user,
      isNewUser: created
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router; 