const app = require('../server');
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Connect to database for serverless functions
// This ensures connection is established before handling requests
const connectDatabase = async () => {
  // Check if already connected (readyState: 1 = connected)
  if (mongoose.connection.readyState === 1) {
    return;
  }
  
  try {
    await connectDB();
    console.log('Database connected in serverless function');
  } catch (error) {
    console.error('Database connection error in serverless:', error.message);
    throw error;
  }
};

// Export the handler for Vercel
module.exports = async (req, res) => {
  try {
    // Connect to database if not already connected
    await connectDatabase();
    
    // Handle the request with the Express app
    return app(req, res);
  } catch (error) {
    // If connection fails, return error response
    return res.status(503).json({
      error: 'Database connection error',
      message: 'Unable to connect to database. Please try again later.'
    });
  }
};

