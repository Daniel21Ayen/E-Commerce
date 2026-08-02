const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { prisma } = require('../config/database');
const redis = require('../config/redis');
const { logger } = require('./logger');

/**
 * Authentication Middleware
 * Protects routes by verifying JWT token
 */
const protect = async (req, res, next) => {
  let token;

  try {
    // 1. Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Check if token exists in cookies (for web apps)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 3. Check if token exists in query params (for WebSocket/SSE)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized. Please log in to access this resource.',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    // 4. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 5. Check if token is blacklisted (logout)
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      logger.warn('Authentication failed: Token blacklisted', {
        userId: decoded.id,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(401).json({
        status: 'error',
        message: 'Session expired. Please log in again.',
        code: 'AUTH_TOKEN_BLACKLISTED'
      });
    }

    // 6. Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.id,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            avatarUrl: true,
            bio: true,
            preferredLanguage: true
          }
        }
      }
    });

    if (!user) {
      logger.warn('Authentication failed: User not found', {
        userId: decoded.id,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(401).json({
        status: 'error',
        message: 'User account not found. Please contact support.',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      logger.warn('Authentication failed: Account inactive', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
        code: 'AUTH_ACCOUNT_INACTIVE'
      });
    }

    // 7. Check token version (if user changed password)
    if (decoded.tokenVersion && user.tokenVersion !== decoded.tokenVersion) {
      logger.warn('Authentication failed: Token version mismatch', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });
      
      return res.status(401).json({
        status: 'error',
        message: 'Session invalid. Please log in again.',
        code: 'AUTH_TOKEN_VERSION_MISMATCH'
      });
    }

    // 8. Attach user to request
    req.user = user;
    req.token = token;
    req.tokenDecoded = decoded;

    // 9. Update last login (async, don't wait)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(err => {
      logger.error('Failed to update last login:', err);
    });

    // 10. Log successful authentication
    logger.info('Authentication successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Authentication failed: Invalid token', {
        error: error.message,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.',
        code: 'AUTH_INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: Token expired', {
        ip: req.ip,
        path: req.path
      });
      
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please log in again.',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }

    // Handle other errors
    logger.error('Authentication error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed. Please try again later.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Admin Middleware
 * Restricts access to admin users only
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authenticated. Please log in.',
      code: 'ADMIN_NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    logger.warn('Admin access denied', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.',
      code: 'ADMIN_ACCESS_DENIED'
    });
  }

  // Log admin access
  logger.info('Admin access granted', {
    userId: req.user.id,
    email: req.user.email,
    role: req.user.role,
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  next();
};

/**
 * Super Admin Middleware
 * Restricts access to super admin only
 */
const superAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authenticated. Please log in.',
      code: 'SUPER_ADMIN_NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'super_admin') {
    logger.warn('Super admin access denied', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      path: req.path
    });
    
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Super admin privileges required.',
      code: 'SUPER_ADMIN_ACCESS_DENIED'
    });
  }

  next();
};

/**
 * Optional Authentication Middleware
 * Allows both authenticated and unauthenticated access
 */
const optionalAuth = async (req, res, next) => {
  let token;

  try {
    // Check for token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      // Verify token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      
      // Check if token is blacklisted
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (!isBlacklisted) {
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { 
            id: decoded.id,
            isActive: true
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
            isEmailVerified: true,
            profile: {
              select: {
                avatarUrl: true,
                preferredLanguage: true
              }
            }
          }
        });

        if (user && user.isActive) {
          req.user = user;
          req.token = token;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on error, just continue without user
    logger.debug('Optional auth failed, continuing without user', {
      error: error.message,
      ip: req.ip,
      path: req.path
    });
    next();
  }
};

/**
 * Permission-based Authorization Middleware
 * Checks if user has specific permissions
 */
const hasPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated. Please log in.',
          code: 'PERMISSION_NOT_AUTHENTICATED'
        });
      }

      // Admins have all permissions
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next();
      }

      // Get user permissions from database
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId: req.user.id },
        select: { permission: true }
      });

      const userPermissionSet = new Set(userPermissions.map(p => p.permission));

      // Check if user has any of the required permissions
      const hasRequiredPermission = permissions.some(p => userPermissionSet.has(p));

      if (!hasRequiredPermission) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          email: req.user.email,
          requiredPermissions: permissions,
          userPermissions: Array.from(userPermissionSet),
          ip: req.ip,
          path: req.path
        });
        
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions to perform this action.',
          code: 'PERMISSION_DENIED',
          required: permissions
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Permission check failed.',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

/**
 * Rate Limiting by User Role
 */
const roleRateLimit = (limits) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user ? req.user.role : 'guest';
      const limit = limits[userRole] || limits.default || 100;
      
      // Check if rate limit exceeded
      const key = `rate_limit:${userRole}:${req.ip}`;
      const current = await redis.get(key);
      
      if (current && parseInt(current) >= limit) {
        return res.status(429).json({
          status: 'error',
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      // Increment counter
      await redis.increment(key);
      await redis.expire(key, 60); // Reset every minute

      next();
    } catch (error) {
      logger.error('Rate limit error:', error);
      next();
    }
  };
};

module.exports = {
  protect,
  admin,
  superAdmin,
  optionalAuth,
  hasPermission,
  roleRateLimit
};