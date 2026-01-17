# Email Verification Implementation - Brevo Integration

## Overview

This document describes the email verification system implemented using Brevo (formerly Sendinblue) as the transactional email provider. The implementation includes secure code generation, rate limiting, and centralized route protection.

## Backend Implementation

### 1. Dependencies
- `@getbrevo/brevo` - Official Brevo SDK for sending transactional emails

### 2. User Model Updates (`backend/models/User.js`)
Added the following fields to the User schema:
- `isEmailVerified` (Boolean, default: false)
- `emailVerificationCode` (String, hashed, select: false)
- `emailVerificationExpiresAt` (Date, select: false)
- `emailVerificationAttempts` (Number, default: 0, select: false)
- `emailVerificationBlockedUntil` (Date, select: false)
- `emailVerificationLastSentAt` (Date, select: false)

### 3. Email Service (`backend/utils/emailService.js`)
- Sends HTML-formatted verification emails via Brevo
- Includes 6-digit code with expiration notice
- Handles API errors gracefully

### 4. Authentication Routes (`backend/routes/auth.js`)

#### Signup Flow
- Generates 6-digit numeric verification code
- Hashes code before storing in database
- Sets 10-minute expiration
- Sends verification email immediately after signup
- Returns user object with `isEmailVerified: false`

#### Email Verification Endpoint (`POST /api/auth/verify-email`)
- Validates email and verification code
- Checks code expiration
- Implements rate limiting:
  - Maximum 5 failed attempts
  - 15-minute block after exceeding limit
  - Returns remaining attempts on failure
- On success: sets `isEmailVerified: true` and clears verification fields

#### Resend Verification Code (`POST /api/auth/resend-verification`)
- 1-minute cooldown between resend requests
- Generates new code and resets expiration
- Clears previous failed attempts

#### Signin Updates
- Includes `isEmailVerified` status in response
- Allows login but access is restricted until verified

### 5. Middleware (`backend/middleware/emailVerification.js`)
- `requireEmailVerification` middleware for protecting routes
- Checks email verification status
- Exempts admin users from verification requirement

## Frontend Implementation

### 1. Email Verification Page (`frontend/src/pages/EmailVerification.tsx`)
- Dedicated page for entering 6-digit verification code
- Auto-focus on code input
- Resend functionality with cooldown timer
- Shows remaining attempts and error messages
- Redirects to intended destination after verification

### 2. Protected Route Updates (`frontend/src/components/ProtectedRoute.tsx`)
- Centralized email verification check
- Redirects unverified users to `/verify-email`
- Preserves intended destination for post-verification redirect
- Exempts admin users from verification requirement

### 3. Signup Modal Updates (`frontend/src/components/modals/SignUpModal.tsx`)
- Redirects to verification page immediately after signup
- Passes email in navigation state

### 4. Login Modal Updates (`frontend/src/components/modals/LoginModal.tsx`)
- Checks email verification status after login
- Redirects to verification page if not verified

### 5. Auth Context Updates (`frontend/src/contexts/AuthContext.tsx`)
- Added `isEmailVerified` to User interface
- `refreshUser()` method to update user state after verification

### 6. API Client Updates (`frontend/src/lib/api.ts`)
- `verifyEmail(email, code)` - Verify email with code
- `resendVerificationCode(email)` - Request new code

### 7. Routing (`frontend/src/App.tsx`)
- Added `/verify-email` route

## Environment Variables

Add the following to your `.env` file in the backend directory:

```env
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Brands App
```

### Getting Brevo API Key
1. Sign up at https://www.brevo.com/
2. Navigate to Settings > API Keys
3. Create a new API key
4. Copy the key to `BREVO_API_KEY`

### Sender Email
- Must be a verified sender in your Brevo account
- Can be your domain email or a verified email address
- Configure in Brevo: Settings > Senders & IP

## Security Features

1. **Code Hashing**: Verification codes are hashed using bcrypt before storage
2. **Rate Limiting**: 
   - Maximum 5 failed verification attempts
   - 15-minute account lockout after exceeding limit
   - 1-minute cooldown for resend requests
3. **Code Expiration**: Codes expire after 10 minutes
4. **Centralized Protection**: All protected routes check verification status
5. **Admin Exemption**: Admin users bypass email verification

## User Flow

1. **Signup**:
   - User creates account
   - Receives verification email with 6-digit code
   - Redirected to verification page

2. **Verification**:
   - User enters 6-digit code
   - System validates code and expiration
   - On success: email verified, user can access protected routes
   - On failure: shows remaining attempts

3. **Resend**:
   - User can request new code after 1-minute cooldown
   - New code expires in 10 minutes

4. **Login**:
   - User can login even if not verified
   - Access to protected routes is blocked until verified
   - Redirected to verification page if attempting to access protected route

## Testing

### Manual Testing Checklist
- [ ] Signup sends verification email
- [ ] Verification code works correctly
- [ ] Expired codes are rejected
- [ ] Rate limiting blocks after 5 failed attempts
- [ ] Resend cooldown works (1 minute)
- [ ] Protected routes redirect unverified users
- [ ] Verified users can access protected routes
- [ ] Admin users bypass verification

### Error Scenarios
- Invalid verification code
- Expired code
- Too many failed attempts
- Resend during cooldown
- Missing email in verification request

## Notes

- Email sending failures during signup don't block account creation
- Users can request resend if email wasn't received
- Verification status is included in all auth responses
- All verification-related fields are excluded from default user queries (select: false)









