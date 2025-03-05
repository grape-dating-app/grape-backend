const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, initPostGIS } = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle chat messages
  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  // Handle location updates
  socket.on('update_location', (data) => {
    socket.to(data.userId).emit('location_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database initialization
const initializeDatabase = async () => {
  try {
    await initPostGIS();
    await sequelize.sync();
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on port ${PORT}`);
}); 