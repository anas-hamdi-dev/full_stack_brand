const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging and monitoring
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };
  
  console.error('[Error Handler]', JSON.stringify(errorLog, null, 2));

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key (race condition indicator)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `Duplicate ${duplicateField} value entered. This may indicate a race condition.`;
    error = { message, statusCode: 409 }; // 409 Conflict is more appropriate
    
    // Log potential race condition
    console.warn('[Race Condition Detected]', {
      field: duplicateField,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // MongoDB write conflict (version error)
  if (err.name === 'VersionError') {
    const message = 'Document was modified by another process. Please refresh and try again.';
    error = { message, statusCode: 409 };
    console.warn('[Write Conflict]', {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Database connection errors
  if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    if (!error.statusCode) {
      error = { 
        message: 'Database operation failed. Please try again.', 
        statusCode: 503 
      };
    }
  }

  res.status(error.statusCode || 500).json({
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
