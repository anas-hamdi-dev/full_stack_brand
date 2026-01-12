const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Brand = require('../models/Brand');
const authenticate = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/emailService');

// Helper function to generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reject admin login attempts - admins should use the admin panel
    if (user.role === 'admin') {
      return res.status(403).json({ 
        error: 'Admin access denied',
        message: 'Admin users must sign in through the admin panel. Please use the admin panel login page.'
      });
    }

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from user object
    const userObj = user.toObject();
    delete userObj.password;

    // Ensure emailVerified is included in response
    res.json({ 
      user: {
        ...userObj,
        isEmailVerified: user.isEmailVerified || false
      }, 
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Signup request body:', { email, password: password ? '***' : undefined, full_name, phone, role });
    }

    if (!email || !password || !role || !phone) {
      return res.status(400).json({ 
        error: 'Email, password, phone, and role are required',
        received: { 
          email: !!email, 
          password: !!password, 
          phone: !!phone,
          role: !!role 
        }
      });
    }

    if (!['client', 'brand_owner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "client" or "brand_owner"' });
    }

    // Validate Tunisian phone number format
    // Format: +216 followed by 8 digits, first digit after country code must be 2, 4, 5, or 9
    const cleanedPhone = phone.replace(/[\s-]/g, '');
    const tunisianPhoneRegex = /^\+216[2-9]\d{7}$/;
    if (!tunisianPhoneRegex.test(cleanedPhone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Must be a valid Tunisian mobile number (+216 followed by 8 digits starting with 2, 4, 5, or 9)' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user - brand will be created later by brand_owner through their profile
    // Use email prefix as default full_name if not provided
    const defaultFullName = full_name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    
    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    
    // Set expiration to 10 minutes from now
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10);
    
    const user = await User.create({
      email,
      password, // Will be hashed by pre-save hook
      full_name: defaultFullName,
      phone: cleanedPhone, // Use cleaned phone number
      role,
      isEmailVerified: false,
      emailVerificationCode: hashedCode,
      emailVerificationExpiresAt: expirationDate,
      emailVerificationAttempts: 0,
      emailVerificationLastSentAt: new Date()
    });

    // Send verification email via Brevo
    try {
      await sendVerificationEmail(email, verificationCode, defaultFullName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail signup if email fails, but log the error
      // User can request resend later
    }

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove sensitive fields from response
    const userObj = user.toObject();
    delete userObj.emailVerificationCode;
    delete userObj.emailVerificationExpiresAt;
    delete userObj.emailVerificationAttempts;
    delete userObj.emailVerificationBlockedUntil;
    delete userObj.emailVerificationLastSentAt;

    res.status(201).json({ user: userObj, token });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signout
router.post('/signout', authenticate, (req, res) => {
  // Token invalidation handled client-side
  // For server-side invalidation, implement token blacklist
  res.json({ success: true });
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    // Find user with verification fields
    const user = await User.findOne({ email }).select('+emailVerificationCode +emailVerificationExpiresAt +emailVerificationAttempts +emailVerificationBlockedUntil');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Check if user is blocked due to too many failed attempts
    if (user.emailVerificationBlockedUntil && new Date() < user.emailVerificationBlockedUntil) {
      const blockedUntil = new Date(user.emailVerificationBlockedUntil);
      const minutesRemaining = Math.ceil((blockedUntil - new Date()) / 1000 / 60);
      return res.status(429).json({ 
        error: 'Too many failed verification attempts. Please try again later.',
        retryAfter: minutesRemaining
      });
    }

    // Check if verification code exists and hasn't expired
    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    if (new Date() > user.emailVerificationExpiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Verify the code
    const isValidCode = await bcrypt.compare(verificationCode, user.emailVerificationCode);
    
    if (!isValidCode) {
      // Increment failed attempts
      const newAttempts = (user.emailVerificationAttempts || 0) + 1;
      const maxAttempts = 5; // Maximum attempts before blocking
      const blockDurationMinutes = 15; // Block for 15 minutes

      if (newAttempts >= maxAttempts) {
        const blockedUntil = new Date();
        blockedUntil.setMinutes(blockedUntil.getMinutes() + blockDurationMinutes);
        user.emailVerificationBlockedUntil = blockedUntil;
        user.emailVerificationAttempts = 0; // Reset attempts after blocking
        await user.save();
        
        return res.status(429).json({ 
          error: 'Too many failed verification attempts. Your account has been temporarily blocked. Please try again in 15 minutes.',
          retryAfter: blockDurationMinutes
        });
      }

      user.emailVerificationAttempts = newAttempts;
      await user.save();

      const remainingAttempts = maxAttempts - newAttempts;
      return res.status(400).json({ 
        error: 'Invalid verification code',
        remainingAttempts
      });
    }

    // Code is valid - verify email
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiresAt = undefined;
    user.emailVerificationAttempts = 0;
    user.emailVerificationBlockedUntil = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user with verification fields
    const user = await User.findOne({ email }).select('+emailVerificationLastSentAt');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Check resend cooldown (1 minute)
    const cooldownMinutes = 1;
    if (user.emailVerificationLastSentAt) {
      const timeSinceLastSent = new Date() - new Date(user.emailVerificationLastSentAt);
      const cooldownMs = cooldownMinutes * 60 * 1000;
      
      if (timeSinceLastSent < cooldownMs) {
        const secondsRemaining = Math.ceil((cooldownMs - timeSinceLastSent) / 1000);
        return res.status(429).json({ 
          error: 'Please wait before requesting a new code',
          retryAfter: secondsRemaining
        });
      }
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const hashedCode = await bcrypt.hash(verificationCode, 10);
    
    // Set expiration to 10 minutes from now
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10);

    // Update user with new code
    user.emailVerificationCode = hashedCode;
    user.emailVerificationExpiresAt = expirationDate;
    user.emailVerificationAttempts = 0; // Reset attempts
    user.emailVerificationBlockedUntil = undefined; // Clear block
    user.emailVerificationLastSentAt = new Date();
    await user.save();

    // Send verification email via Brevo
    try {
      await sendVerificationEmail(email, verificationCode, user.full_name);
      res.json({ 
        success: true, 
        message: 'Verification code sent successfully' 
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('brand_id');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
