// File: app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const userRoutes = require('./src/routes/userRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const likeRoutes = require('./src/routes/likeRoutes');
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add socket.io to req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a personal room for private messages
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/likes', likeRoutes);

// Home route (protected)
app.get('/api/home', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Welcome to the home page!', 
    user: req.user 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

module.exports = { app, httpServer };