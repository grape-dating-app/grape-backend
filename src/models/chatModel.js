const { supabase } = require('../config/db');

const ChatModel = {
  // Validate that users exist
  async validateUsers(senderId, receiverId) {
    try {
      return await supabase
        .from('users')
        .select('id')
        .in('id', [senderId, receiverId]);
    } catch (error) {
      throw error;
    }
  },

  // Create a new message
  async createMessage(senderId, receiverId, content) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          timestamp: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message);
      }
      return data[0];
    } catch (error) {
      console.error('Error in createMessage:', error);
      throw error;
    }
  },

  // Get chat history between two users
  async getChatHistory(user1Id, user2Id) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get all recent chats for a user
  async getUserChats(userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      // Group messages by conversation
      const conversations = data.reduce((acc, message) => {
        const otherId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        if (!acc[otherId]) {
          acc[otherId] = [];
        }
        acc[otherId].push(message);
        return acc;
      }, {});

      return conversations;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = ChatModel; 