// Vercel Serverless Function Entry Point
// This file exports the Express app for Vercel's serverless environment

const express = require('express');
const cors = require('cors');
const connectDB = require('../config/database');
const errorHandler = require('../middleware/errorHandler');

// Initialize Express app
const app = express();

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL ,
      'https://www.el-mall.tn',
      'https://el-mall.tn',
     
    ].filter(Boolean); // Remove undefined values
    
    // In development, allow all origins if FRONTEND_URL is not set
    if (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0) {
      return callback(null, true);
    }
    
    // Check if origin matches any allowed origin (including subdomains)
    const originMatches = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      // Exact match
      if (origin === allowed) return true;
      // Match with protocol variations
      if (origin.replace(/^https?:\/\//, '') === allowed.replace(/^https?:\/\//, '')) {
        return true;
      }
      return false;
    });
    
    if (originMatches || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Security headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By header (Express default)
  res.removeHeader('X-Powered-By');
  
  next();
});

// Middleware
app.use(cors(corsOptions));
// Increase body size limit to handle large base64-encoded images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to database (optimized for serverless)
let dbConnected = false;

const ensureDBConnection = async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      return res.status(500).json({
        error: {
          message: 'Database connection failed',
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        }
      });
    }
  }
  next();
};

// Apply database connection middleware to all routes
app.use(ensureDBConnection);

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/brands', require('../routes/brands'));
app.use('/api/products', require('../routes/products'));
app.use('/api/favorites', require('../routes/favorites'));
app.use('/api/contact-messages', require('../routes/contact-messages'));
app.use('/api/admin', require('../routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Brands App API',
    version: '1.0.0',
    health: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// Error handler (must be last)
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;
