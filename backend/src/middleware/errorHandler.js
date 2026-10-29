// ============================================================
// Global Error Handler
// ============================================================

function errorHandler(err, req, res, _next) {
  console.error('❌ Unhandled Error:', err);

  const status = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again later.';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Custom operational error class.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
