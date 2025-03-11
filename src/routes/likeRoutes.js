const express = require('express');
const router = express.Router();
const { likeUser, getWhoLikedYou, acceptLike, rejectLike } = require('../controllers/likeController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all like routes
router.use(authenticateToken);

// Like a user
router.post('/', likeUser);

// Get users who liked you
router.get('/who-liked-me', getWhoLikedYou);

// Accept someone's like on your profile (creates a match)
router.post('/accept/:likerId', acceptLike);

// Reject someone's like on your profile
router.post('/reject/:likerId', rejectLike);

module.exports = router; 