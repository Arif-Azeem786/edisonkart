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

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Strict rate limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Strict rate limits for AI-powered endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Rate limit reached. Please wait a moment.' },
});
app.use('/api/chat', aiLimiter);
app.use('/api/products/search/image', aiLimiter);
app.use('/api/products/import', rateLimit({ windowMs: 60 * 1000, max: 5 }));

// Body parser - use 50mb to avoid 413 Payload Too Large when submitting product forms with many images
// If using nginx, also set: client_max_body_size 50m;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// SEO sitemap (public, not under /api)
app.use(require('./modules/seo/seo.routes'));

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

// 404 handler (must be before error middleware)
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);


module.exports = app;
