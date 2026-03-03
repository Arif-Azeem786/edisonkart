const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { setupGridFS } = require('./config/gridfs');
const errorMiddleware = require('./middleware/error.middleware.js');

// Import routes
const routes = require('./routes');

const app = express();

// Connect to MongoDB
connectDB();

// Setup GridFS
setupGridFS();

// CORS configuration (must be before helmet)
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Security middleware — allow cross-origin so frontend can load images
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api', limiter);

// Body parser - use 50mb to avoid 413 Payload Too Large when submitting product forms with many images
// If using nginx, also set: client_max_body_size 50m;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware (should be last)
app.use(errorMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


module.exports = app;
