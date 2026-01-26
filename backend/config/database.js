const mongoose = require('mongoose');

// Cache the connection for serverless (Vercel) environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // If we have a cached connection in serverless environment, return it
    if (cached.conn) {
      return cached.conn;
    }

    // If we don't have a connection promise, create one
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for DNS resolution
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        connectTimeoutMS: 30000, // Timeout for initial connection establishment
        // Retry settings for better reliability
        retryWrites: true,
        retryReads: true,
        // DNS resolution settings
        heartbeatFrequencyMS: 10000, // Frequency of server monitoring
      };

      cached.promise = mongoose.connect(mongoURI, opts).then((mongoose) => {
        console.log('MongoDB Connected');
        return mongoose;
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  } catch (error) {
    let errorMessage = `MongoDB connection error: ${error.message}`;
    
    // Provide helpful error messages for common DNS/timeout issues
    if (error.message.includes('queryTxt') || error.message.includes('ETIMEOUT')) {
      errorMessage += '\n\nDNS Resolution Timeout - Possible causes:';
      errorMessage += '\n1. Network connectivity issues';
      errorMessage += '\n2. DNS server problems or slow response';
      errorMessage += '\n3. Firewall blocking DNS queries (port 53)';
      errorMessage += '\n4. VPN or proxy interfering with DNS resolution';
      errorMessage += '\n5. MongoDB Atlas IP whitelist restrictions';
      errorMessage += '\n\nTroubleshooting steps:';
      errorMessage += '\n- Check internet connection';
      errorMessage += '\n- Try using a different DNS server (e.g., 8.8.8.8, 1.1.1.1)';
      errorMessage += '\n- Verify MongoDB Atlas network access settings';
      errorMessage += '\n- Check if firewall/VPN is blocking DNS queries';
      errorMessage += '\n- Ensure MONGODB_URI connection string is correct';
    }
    
    console.error(errorMessage);
    throw error;
  }
};

module.exports = connectDB;
