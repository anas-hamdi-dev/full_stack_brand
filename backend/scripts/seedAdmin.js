  /**
   * Admin User Seeding Script
   * 
   * This script creates an admin user in the database.
   * Admin users can only be created manually via this script or by existing admins.
   * 
   * Usage:
   *   node scripts/seedAdmin.js <email> <password> <fullName> [phone]
   * 
   * Example:
   *   node scripts/seedAdmin.js admin@example.com securePassword123 "Admin User" "+21612345678"
   * 
   * IMPORTANT: Change the default password in production!
   */

  require('dotenv').config();
  const mongoose = require('mongoose');
  const User = require('../models/User');
  const connectDB = require('../config/database');

  async function seedAdmin() {
    try {
      // Connect to database
      await connectDB();

      // Get arguments from command line
      const args = process.argv.slice(2);
      const email = args[0] || process.env.ADMIN_EMAIL || 'admin@tunisfashion.com';
      const password = args[1] || process.env.ADMIN_PASSWORD || 'admin123';
      const fullName = args[2] || process.env.ADMIN_NAME || 'Admin User';
      const phone = args[3] || process.env.ADMIN_PHONE || '+21621234567'; // Default admin phone (valid Tunisian format)

      // Validate email
      if (!email || !email.includes('@')) {
        console.error('❌ Error: Valid email is required');
        process.exit(1);
      }

      // Validate password length
      if (!password || password.length < 6) {
        console.error('❌ Error: Password must be at least 6 characters');
        process.exit(1);
      }

      // Validate phone number format (Tunisian format)
      const cleanedPhone = phone.replace(/[\s-]/g, '');
      const tunisianPhoneRegex = /^\+216[2-9]\d{7}$/;
      if (!tunisianPhoneRegex.test(cleanedPhone)) {
        console.error('❌ Error: Invalid phone number format. Must be a valid Tunisian mobile number (+216 followed by 8 digits starting with 2, 4, 5, or 9)');
        console.error(`   Provided: ${phone}`);
        process.exit(1);
      }

      // Check if admin user already exists
      const existingAdmin = await User.findOne({ email, role: 'admin' });
      if (existingAdmin) {
        console.log(`⚠️  Admin user with email ${email} already exists`);
        console.log('   Use a different email or update the existing admin via the admin panel');
        process.exit(0);
      }

      // Check if user with this email exists (any role)
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.error(`❌ Error: User with email ${email} already exists with role: ${existingUser.role}`);
        console.error('   Cannot convert existing user to admin. Use a different email.');
        process.exit(1);
      }

      // Create admin user
      // Password will be hashed by pre-save hook
      const adminUser = await User.create({
        email: email.toLowerCase().trim(),
        password, // Will be hashed by pre-save hook
        full_name: fullName,
        phone: cleanedPhone, // Use cleaned phone number
        role: 'admin',
        // Admin users don't have status or brand_id
        status: undefined,
        brand_id: null
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.full_name}`);
      console.log(`   Phone: ${adminUser.phone}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   ID: ${adminUser._id}`);
      console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

      process.exit(0);
    } catch (error) {
      console.error('❌ Error creating admin user:', error.message);
      if (error.code === 11000) {
        console.error('   Duplicate email detected');
      }
      process.exit(1);
    }
  }

  // Run the script
  seedAdmin();
