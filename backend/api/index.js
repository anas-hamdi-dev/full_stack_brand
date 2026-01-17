const express = require('express');
const cors = require('cors');
const errorHandler = require('../middleware/errorHandler');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
// Increase body size limit to handle large base64-encoded images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  res.json({ status: 'OK', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Brands App API',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// For Vercel serverless, we don't start a server
// Instead, we export the app as a serverless function
// Export both app and connectDatabase
const handler = app;
handler.connectDatabase = connectDatabase;
module.exports = handler;

// Connect to database on cold start
// This will run when the serverless function is first invoked
let dbConnected = false;
let dbConnectionPromise = null;

const connectDatabase = async () => {
  if (dbConnected) {
    return;
  }

  // If connection is in progress, wait for it
  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }

  // Start new connection
  dbConnectionPromise = (async () => {
    try {
      const mongoose = require('mongoose');
      const mongoURI = process.env.MONGODB_URI;
      
      if (!mongoURI) {
        console.error('MONGODB_URI is not defined');
        return;
      }

      // Check if already connected
      if (mongoose.connection.readyState === 1) {
        dbConnected = true;
        return;
      }

      // Connect with serverless-friendly options
      const conn = await mongoose.connect(mongoURI, {
        maxPoolSize: 1, // Maintain up to 1 socket connection for serverless
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering
      });

      console.log(`MongoDB Connected: ${conn.connection.host}`);
      dbConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
      dbConnectionPromise = null; // Allow retry on next invocation
      // Don't throw - let individual routes handle DB errors
    }
  })();

  return dbConnectionPromise;
};

// Connect database on module load (cold start)
// This ensures connection is ready before handling requests
if (process.env.MONGODB_URI) {
  connectDatabase().catch(console.error);
}

// Export a function to ensure DB connection before handling requests
module.exports.connectDatabase = connectDatabase;

