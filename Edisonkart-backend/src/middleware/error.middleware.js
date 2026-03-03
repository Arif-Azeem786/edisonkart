const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = { statusCode: 400, message };
  }

  // Mongoose validation error (schema validation has err.errors; pre-hook may set only err.message)
  if (err.name === 'ValidationError') {
    const message = err.errors && typeof err.errors === 'object'
      ? Object.values(err.errors).map(val => val.message).join(', ')
      : (err.message || 'Validation failed');
    error = { statusCode: 400, message };
  }

  // JWT errors — use 200 to avoid frontend "status code 401" errors
  if (err.name === 'JsonWebTokenError') {
    error = { statusCode: 200, message: 'Invalid token' };
  }

  if (err.name === 'TokenExpiredError') {
    error = { statusCode: 200, message: 'Token expired' };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;