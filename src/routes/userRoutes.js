const express = require('express');
const router = express.Router();
const { updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all user routes
router.use(authenticateToken);

// Update user details
router.put('/:userId', updateUser);

// Delete user account
router.delete('/:userId', deleteUser);

module.exports = router; 