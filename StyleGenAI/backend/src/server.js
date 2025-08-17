const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection, Firebase, and Replicate AI
const connectDB = require('../config/database');
const { initializeFirebase } = require('../config/firebase');
const { initializeReplicate } = require('../config/replicate');
const { initializeHuggingFace } = require('../config/huggingface');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database and initialize services
console.log('🚀 Starting StyleGen AI Backend...');
connectDB();
initializeFirebase();
console.log(' Initializing Hugging Face...');
initializeHuggingFace();
console.log(' Initializing Replicate...');
initializeReplicate();
console.log('AI services initialized');

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'StyleGen AI Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for frontend connectivity
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Frontend-Backend connection working!',
    replicate: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/designs', require('../routes/designs'));
app.use('/api/feedback', require('../routes/feedback'));
// app.use('/api/users', require('../routes/users'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StyleGen AI Backend running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
