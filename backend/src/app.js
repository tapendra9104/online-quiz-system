// ============================================================
// Express Application — Entry Point
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const db = require('./config/db');

const authRoutes    = require('./routes/authRoutes');
const quizRoutes    = require('./routes/quizRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ── Serve Static Frontend ───────────────────────────────────
app.use(express.static(path.join(__dirname, '../../frontend')));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/quizzes',  quizRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/payments', paymentRoutes);

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (_err) {
    res.status(503).json({ status: 'unavailable', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// ── SPA Fallback ────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// ── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Online Quiz System running at http://localhost:${PORT}\n`);
});

// ── Graceful Shutdown ───────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    db.end().then(() => {
      console.log('Database connections closed.');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
