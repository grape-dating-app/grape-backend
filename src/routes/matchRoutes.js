const express = require('express');
const router = express.Router();
const { createMatch, getUserMatches, unmatchUsers } = require('../controllers/matchController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all match routes
router.use(authenticateToken);

// Create a new match
router.post('/', createMatch);

// Get all matches for a user
router.get('/user/:userId', getUserMatches);

// Unmatch users
router.put('/unmatch/:user1_id/:user2_id', unmatchUsers);

module.exports = router; 