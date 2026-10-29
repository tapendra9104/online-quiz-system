// ============================================================
// Auth Controller — Login, Register & Password Management
// ============================================================
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;

/** Sanitize string to prevent XSS */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // SECURITY: Public registration always creates 'student' accounts.
    // Admin accounts must be created by existing admins via admin panel.
    const userRole = 'student';

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new AppError('Email is already registered.', 409);
    }

    const safeName = sanitize(name);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [safeName, email, hashedPassword, userRole]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: userRole, name: safeName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: result.insertId, name: safeName, email, role: userRole },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      throw new AppError('Invalid email or password.', 401);
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getProfile(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      throw new AppError('User not found.', 404);
    }
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError('Current password and new password are required.', 400);
    }
    if (new_password.length < 6) {
      throw new AppError('New password must be at least 6 characters.', 400);
    }

    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) throw new AppError('User not found.', 404);

    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) throw new AppError('Current password is incorrect.', 401);

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/profile — Update name
 */
async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters.', 400);
    }

    const safeName = sanitize(name.trim());
    await db.query('UPDATE users SET name = ? WHERE id = ?', [safeName, req.user.id]);

    // Return updated token with new name
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role, name: safeName },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ message: 'Profile updated.', token, user: { id: req.user.id, name: safeName, email: req.user.email, role: req.user.role } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile, changePassword, updateProfile, sanitize };
