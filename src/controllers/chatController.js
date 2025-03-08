const ChatModel = require('../models/chatModel');

const ChatController = {
  // Send a message
  async sendMessage(req, res) {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const { receiverId, content } = req.body;
      const senderId = req.user.uid;

      // Validate required fields
      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: 'receiverId is required'
        });
      }

      if (!content || content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'content is required and cannot be empty'
        });
      }

      // Validate that both users exist
      const { data: users, error: userError } = await ChatModel.validateUsers(senderId, receiverId);
      if (userError) {
        console.error('Error validating users:', userError);
        return res.status(500).json({
          success: false,
          message: 'Error validating users'
        });
      }

      if (!users || users.length !== 2) {
        return res.status(404).json({
          success: false,
          message: 'One or both users not found'
        });
      }

      const message = await ChatModel.createMessage(senderId, receiverId, content);
      
      // Emit the message through socket if needed
      if (req.io) {
        req.io.to(`user_${receiverId}`).emit('new_message', message);
      }

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        details: error.message
      });
    }
  },

  // Get chat history with another user
  async getChatHistory(req, res) {
    try {
      const { otherUserId } = req.params;
      const userId = req.user.uid;

      const messages = await ChatModel.getChatHistory(userId, otherUserId);
      
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chat history'
      });
    }
  },

  // Get all user's chats
  async getUserChats(req, res) {
    try {
      const userId = req.user.uid;

      const conversations = await ChatModel.getUserChats(userId);
      
      res.status(200).json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error getting user chats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user chats'
      });
    }
  }
};

module.exports = ChatController; 