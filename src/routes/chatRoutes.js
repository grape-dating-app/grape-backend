const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// All chat routes should be protected
router.use(authenticateToken);

// Send a message to another user
router.post('/send', ChatController.sendMessage);

// Get chat history with another user
router.get('/history/:otherUserId', ChatController.getChatHistory);

// Get all user's chats
router.get('/conversations', ChatController.getUserChats);

module.exports = router; 