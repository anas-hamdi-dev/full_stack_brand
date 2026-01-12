const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI|| "mongodb://localhost:27017/brands_app"   ;
    
    if (!mongoURI) {
      console.error('Error: MONGODB_URI is not defined in environment variables');
      console.error('Please create a .env file with MONGODB_URI=mongodb://localhost:27017/brands_app');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
