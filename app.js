// File: app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const { authenticateToken } = require('./src/middleware/auth');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);

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

module.exports = app;