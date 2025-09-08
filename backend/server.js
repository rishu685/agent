const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
require('dotenv').config();

// Import route modules
const authRoutes = require('./routes/auth');
const llmRoutes = require('./routes/llm');
const queryRoutes = require('./routes/query');
const uploadRoutes = require('./routes/upload');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('combined')); // Logging
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies

// Create necessary directories
const createDirectories = async () => {
  try {
    await fs.ensureDir('./data');
    await fs.ensureDir('./uploads');
    await fs.ensureDir('./temp_data');
    console.log('✅ Required directories created');
  } catch (error) {
    console.error('❌ Error creating directories:', error);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/upload', uploadRoutes);

// Legacy routes (for compatibility with existing frontend)
app.use('/', authRoutes);
app.use('/', llmRoutes);
app.use('/', queryRoutes);
app.use('/', uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AgentX Express.js backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AgentX Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      llm: '/api/llm',
      query: '/api/query',
      upload: '/api/upload',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`
  });
});

// Start server
const startServer = async () => {
  try {
    await createDirectories();
    
    app.listen(PORT, () => {
      console.log('🚀 AgentX Express.js Backend Server Started');
      console.log(`📍 Server running on http://localhost:${PORT}`);
      console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
      console.log('🎯 Ready to serve requests!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
