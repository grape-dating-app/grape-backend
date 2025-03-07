// File: src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { authenticateToken } = require('../middleware/auth');

// Route to send OTP
router.post('/send-otp', authController.sendOTP);

// Route to verify OTP
router.post('/verify-otp', authController.verifyOTP);

// Route to register a new user after OTP verification
// This route requires authentication with the temporary token
router.post('/register', authenticateToken, authController.registerUser);

module.exports = router;