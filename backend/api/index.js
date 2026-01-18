const app = require('../server');
const connectDB = require('../config/database');

// Connect to database for serverless functions
// This ensures connection is established before handling requests
let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
    console.log('Database connected in serverless function');
  } catch (error) {
    console.error('Database connection error in serverless:', error.message);
    isConnected = false;
  }
};

// Export the handler for Vercel
module.exports = async (req, res) => {
  // Connect to database if not already connected
  await connectDatabase();
  
  // Handle the request with the Express app
  return app(req, res);
};

