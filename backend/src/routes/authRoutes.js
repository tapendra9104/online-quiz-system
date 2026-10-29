// ============================================================
// Auth Routes
// ============================================================
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { register, login, getProfile, changePassword, updateProfile } = require('../controllers/authController');

// Stricter rate limiters for auth endpoints (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

// Public
router.post('/register', registerLimiter, validate({
  name:     { required: true, type: 'string', min: 2, max: 100 },
  email:    { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Valid email is required.' },
  password: { required: true, type: 'string', min: 6, message: 'Password must be at least 6 characters.' },
}), register);

router.post('/login', loginLimiter, validate({
  email:    { required: true, type: 'string' },
  password: { required: true, type: 'string' },
}), login);

// Protected
router.get('/me', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
