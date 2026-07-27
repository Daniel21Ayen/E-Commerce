const { logger } = require('./logger');
const { Prisma } = require('@prisma/client');

/**
 * Global Error Handler Middleware
 * Comprehensive error handling for all types of errors
 */
class ErrorHandler {
  /**
   * Main error handler
   */
  static handle(error, req, res, next) {
    // Log error
    logger.error('Error occurred:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.requestId,
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Handle different error types
    if (error.name === 'ValidationError') {
      return this.handleValidationError(error, res);
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      return this.handlePrismaError(error, res);
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return this.handleJWTError(error, res);
    }

    if (error.name === 'MulterError') {
      return this.handleMulterError(error, res);
    }

    if (error.name === 'PaymentError') {
      return this.handlePaymentError(error, res);
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const response = {
      status: 'error',
      message: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_ERROR'
    };

    // Add additional info in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
      response.details = error.details;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error, res) {
    const errors = [];
    
    if (error.errors) {
      // Mongoose validation errors
      for (const field in error.errors) {
        errors.push({
          field,
          message: error.errors[field].message,
          value: error.errors[field].value
        });
      }
    } else if (error.details) {
      // Joi validation errors
      errors.push(...error.details.map(detail => ({
        field: detail.context.key,
        message: detail.message,
        value: detail.context.value
      })));
    }

    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      code: 'VALIDATION_ERROR',
      errors
    });
  }

  /**
   * Handle Prisma errors
   */
  static handlePrismaError(error, res) {
    let statusCode = 400;
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';

    switch (error.code) {
      case 'P2000':
        message = 'The provided value is too long for the field';
        code = 'DB_TOO_LONG';
        break;
      case 'P2001':
        message = 'Record not found';
        code = 'DB_NOT_FOUND';
        statusCode = 404;
        break;
      case 'P2002':
        message = 'Unique constraint violation';
        code = 'DB_UNIQUE_VIOLATION';
        statusCode = 409;
        break;
      case 'P2003':
        message = 'Foreign key constraint violation';
        code = 'DB_FOREIGN_KEY_VIOLATION';
        statusCode = 409;
        break;
      case 'P2004':
        message = 'Database constraint violation';
        code = 'DB_CONSTRAINT_VIOLATION';
        break;
      case 'P2005':
        message = 'Invalid value for field';
        code = 'DB_INVALID_VALUE';
        break;
      case 'P2006':
        message = 'Invalid type for field';
        code = 'DB_INVALID_TYPE';
        break;
      case 'P2007':
        message = 'Data validation error';
        code = 'DB_VALIDATION_ERROR';
        break;
      case 'P2008':
        message = 'Database query error';
        code = 'DB_QUERY_ERROR';
        break;
      case 'P2009':
        message = 'Database connection error';
        code = 'DB_CONNECTION_ERROR';
        statusCode = 503;
        break;
      case 'P2010':
        message = 'Database raw query error';
        code = 'DB_RAW_QUERY_ERROR';
        break;
      case 'P2011':
        message = 'Null constraint violation';
        code = 'DB_NULL_VIOLATION';
        break;
      case 'P2012':
        message = 'Missing required field';
        code = 'DB_MISSING_FIELD';
        break;
      case 'P2013':
        message = 'Missing required argument';
        code = 'DB_MISSING_ARGUMENT';
        break;
      case 'P2014':
        message = 'Invalid relation';
        code = 'DB_INVALID_RELATION';
        break;
      case 'P2015':
        message = 'Record not found';
        code = 'DB_RECORD_NOT_FOUND';
        statusCode = 404;
        break;
      case 'P2016':
        message = 'Query interpretation error';
        code = 'DB_QUERY_INTERPRETATION_ERROR';
        break;
      case 'P2017':
        message = 'Relation violation';
        code = 'DB_RELATION_VIOLATION';
        break;
      default:
        message = `Database error: ${error.code}`;
        code = 'DB_UNKNOWN_ERROR';
    }

    const response = {
      status: 'error',
      message,
      code,
      details: process.env.NODE_ENV === 'development' ? {
        prismaCode: error.code,
        meta: error.meta
      } : undefined
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Handle JWT errors
   */
  static handleJWTError(error, res) {
    let message = 'Authentication failed';
    let code = 'AUTH_ERROR';

    if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please log in again.';
      code = 'AUTH_INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token expired. Please log in again.';
      code = 'AUTH_TOKEN_EXPIRED';
    }

    return res.status(401).json({
      status: 'error',
      message,
      code
    });
  }

  /**
   * Handle Multer (file upload) errors
   */
  static handleMulterError(error, res) {
    let message = 'File upload failed';
    let code = 'UPLOAD_ERROR';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File is too large. Maximum size is 5MB.';
        code = 'UPLOAD_FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        code = 'UPLOAD_TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        code = 'UPLOAD_UNEXPECTED_FIELD';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the request.';
        code = 'UPLOAD_TOO_MANY_PARTS';
        break;
      default:
        message = error.message || 'File upload error';
        code = 'UPLOAD_ERROR';
    }

    return res.status(400).json({
      status: 'error',
      message,
      code
    });
  }

  /**
   * Handle payment errors
   */
  static handlePaymentError(error, res) {
    const statusCode = error.statusCode || 400;
    
    return res.status(statusCode).json({
      status: 'error',
      message: error.message || 'Payment processing failed',
      code: error.code || 'PAYMENT_ERROR',
      paymentDetails: process.env.NODE_ENV === 'development' ? error.details : undefined
    });
  }

  /**
   * Handle 404 Not Found
   */
  static notFound(req, res) {
    logger.warn('Route not found', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id
    });

    return res.status(404).json({
      status: 'error',
      message: `Route ${req.originalUrl} not found`,
      code: 'NOT_FOUND'
    });
  }

  /**
   * Handle async errors
   */
  static asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handle async errors with context
   */
  static asyncWrapperWithContext(fn, context) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next, context)).catch(next);
    };
  }
}

module.exports = ErrorHandler;