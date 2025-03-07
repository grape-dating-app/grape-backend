// File: src/middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};