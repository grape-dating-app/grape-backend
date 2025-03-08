// File: src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Phone verification routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

// Email verification routes
router.post('/send-email-otp', authenticateToken, authController.sendEmailOTP);
router.post('/verify-email-otp', authenticateToken, authController.verifyEmailOTP);

// Profile routes
router.post('/complete-profile', authenticateToken, authController.completeProfile);
router.post('/update-location', authenticateToken, authController.updateLocation);

module.exports = router;