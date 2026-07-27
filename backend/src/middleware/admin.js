const { prisma } = require('../config/database');
const { logger } = require('./logger');

/**
 * Comprehensive Admin Middleware
 * Includes additional admin-specific checks and logging
 */
const adminMiddleware = {
  /**
   * Check if user is admin
   */
  isAdmin: async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated. Please log in.',
          code: 'ADMIN_NOT_AUTHENTICATED'
        });
      }

      // Check if user has admin role
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        logger.warn('Admin access denied - non-admin user', {
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
        method: req.method,
        userAgent: req.get('user-agent')
      });

      next();
    } catch (error) {
      logger.error('Admin check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Admin verification failed.',
        code: 'ADMIN_VERIFICATION_ERROR'
      });
    }
  },

  /**
   * Check if user is super admin
   */
  isSuperAdmin: async (req, res, next) => {
    try {
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

      // Log super admin access
      logger.info('Super admin access granted', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Super admin check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Super admin verification failed.',
        code: 'SUPER_ADMIN_VERIFICATION_ERROR'
      });
    }
  },

  /**
   * Check if user has specific admin permission
   */
  hasAdminPermission: (permission) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            status: 'error',
            message: 'Not authenticated.',
            code: 'ADMIN_PERMISSION_NOT_AUTHENTICATED'
          });
        }

        // Super admin has all permissions
        if (req.user.role === 'super_admin') {
          return next();
        }

        // Check user's admin permissions
        const adminPermission = await prisma.adminPermission.findFirst({
          where: {
            userId: req.user.id,
            permission: permission,
            isActive: true
          }
        });

        if (!adminPermission) {
          logger.warn('Admin permission denied', {
            userId: req.user.id,
            email: req.user.email,
            permission: permission,
            ip: req.ip,
            path: req.path
          });

          return res.status(403).json({
            status: 'error',
            message: `Admin permission '${permission}' required.`,
            code: 'ADMIN_PERMISSION_DENIED'
          });
        }

        next();
      } catch (error) {
        logger.error('Admin permission check error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Admin permission verification failed.',
          code: 'ADMIN_PERMISSION_ERROR'
        });
      }
    };
  },

  /**
   * Audit log for admin actions
   */
  auditLog: (action) => {
    return async (req, res, next) => {
      // Store original send function
      const originalSend = res.send;
      
      // Override send function to capture response
      res.send = function(data) {
        // Log admin action
        const logData = {
          userId: req.user?.id || null,
          email: req.user?.email || null,
          action: action,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          requestBody: req.body,
          requestQuery: req.query,
          requestParams: req.params,
          responseStatus: res.statusCode,
          responseData: data,
          timestamp: new Date().toISOString()
        };

        // Log to database (async)
        prisma.adminAuditLog.create({
          data: {
            userId: req.user?.id,
            action: action,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            requestBody: req.body,
            requestQuery: req.query,
            requestParams: req.params,
            responseStatus: res.statusCode,
            responseData: typeof data === 'string' ? data : JSON.stringify(data)
          }
        }).catch(err => {
          logger.error('Failed to create admin audit log:', err);
        });

        // Log to file
        logger.info('Admin action logged', {
          action: action,
          userId: req.user?.id,
          email: req.user?.email,
          path: req.path,
          method: req.method
        });

        // Call original send
        originalSend.call(this, data);
      };

      next();
    };
  },

  /**
   * IP-based admin access restriction
   */
  restrictByIP: (allowedIPs) => {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      // Skip IP check in development
      if (process.env.NODE_ENV === 'development') {
        return next();
      }

      // Check if IP is allowed
      const isAllowed = allowedIPs.some(ip => {
        if (ip.includes('*')) {
          const pattern = ip.replace(/\*/g, '.*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(clientIP);
        }
        return ip === clientIP;
      });

      if (!isAllowed) {
        logger.warn('Admin access denied - IP not allowed', {
          clientIP,
          allowedIPs,
          userId: req.user?.id,
          email: req.user?.email,
          path: req.path
        });

        return res.status(403).json({
          status: 'error',
          message: 'Access denied from this IP address.',
          code: 'ADMIN_IP_BLOCKED'
        });
      }

      next();
    };
  },

  /**
   * Two-factor authentication check for admin
   */
  require2FA: async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated.',
          code: '2FA_NOT_AUTHENTICATED'
        });
      }

      // Check if 2FA is enabled for this admin
      const adminSettings = await prisma.adminSettings.findUnique({
        where: { userId: req.user.id }
      });

      if (adminSettings?.twoFactorEnabled) {
        const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;
        
        if (!twoFactorToken) {
          return res.status(403).json({
            status: 'error',
            message: 'Two-factor authentication required.',
            code: '2FA_REQUIRED',
            twoFactorRequired: true
          });
        }

        // Verify 2FA token (implement your 2FA verification logic)
        const isValid = await verifyTwoFactorToken(req.user.id, twoFactorToken);
        
        if (!isValid) {
          return res.status(403).json({
            status: 'error',
            message: 'Invalid two-factor authentication token.',
            code: '2FA_INVALID_TOKEN'
          });
        }
      }

      next();
    } catch (error) {
      logger.error('2FA check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Two-factor authentication verification failed.',
        code: '2FA_ERROR'
      });
    }
  }
};

// Helper function for 2FA verification (implement as needed)
const verifyTwoFactorToken = async (userId, token) => {
  // Implement your 2FA verification logic here
  // This could be TOTP, SMS, email verification, etc.
  return true; // Placeholder
};

module.exports = adminMiddleware;