const express = require('express');
const router = express.Router();
const { likeUser, getWhoLikedYou, unlikeUser } = require('../controllers/likeController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all like routes
router.use(authenticateToken);

// Like a user
router.post('/', likeUser);

// Get users who liked you
router.get('/who-liked-me', getWhoLikedYou);

// Unlike a user
router.delete('/:likedId', unlikeUser);

module.exports = router; 