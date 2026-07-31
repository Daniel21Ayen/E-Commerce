// backend/src/controllers/authController.js


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const redis = require('../config/redis');
const { logger } = require('../middleware/logger');
const emailService = require('../services/emailService');
const { Helpers } = require('../utils/helpers'); // <-- FIXED import
const { SECURITY, RESPONSE_CODES, HTTP_STATUS } = require('../utils/constants');

class AuthController {
  /**
   * Track failed login attempts
   */
  static async trackFailedLogin(email) {
    const key = `failed_login:${email.toLowerCase()}`;
    const attempts = await redis.increment(key);
    await redis.expire(key, 15 * 60); // 15 minutes
    return attempts;
  }

  /**
   * Check if account is locked
   */
  static async isAccountLocked(email) {
    const key = `failed_login:${email.toLowerCase()}`;
    const attempts = await redis.get(key);
    return parseInt(attempts) >= 5;
  }

  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const { email, password, confirmPassword, name, phone, address } = req.body;

      console.log('📝 Registration attempt:', { email, name, phone });

      // Validate required fields
      if (!email || !password || !name) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Email, password, and name are required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Passwords do not match',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Validate password length
      if (password.length < 8) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Password must be at least 8 characters',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      if (!emailRegex.test(email)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Please provide a valid email address',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          message: 'Email already registered. Please login or use a different email.',
          code: RESPONSE_CODES.CONFLICT
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name: name.trim(),
          phone: phone || null,
          isEmailVerified: false,
          isActive: true,
          role: 'customer',
          profile: {
            create: {
              preferredLanguage: 'en'
            }
          }
        },
        include: {
          profile: true
        }
      });

      console.log('✅ User created:', user.id);

      // Create address if provided
      if (address && address.street && address.city && address.state && address.zipCode && address.country) {
        await prisma.address.create({
          data: {
            userId: user.id,
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            isDefault: true
          }
        });
      }

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: verificationToken,
          resetPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      // Send emails (don't await to avoid blocking)
      emailService.sendEmailVerification(user, verificationToken).catch(err => {
        console.error('Failed to send verification email:', err);
      });
      emailService.sendWelcomeEmail(user).catch(err => {
        console.error('Failed to send welcome email:', err);
      });

      // Generate JWT
      const token = Helpers.generateJWT(user.id);

      // Log registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      // Remove sensitive data
      const { passwordHash: _, ...userData } = user;

      return res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        message: 'Registration successful. Please check your email for verification.',
        data: {
          user: userData,
          token
        }
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle Prisma unique constraint error
      if (error.code === 'P2002') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          message: 'Email already registered',
          code: RESPONSE_CODES.CONFLICT
        });
      }

      // Handle JWT error
      if (error.message && error.message.includes('JWT_SECRET')) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Server configuration error. Please contact support.',
          code: RESPONSE_CODES.ERROR
        });
      }

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Registration failed. Please try again later.',
        code: RESPONSE_CODES.ERROR,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('🔑 Login attempt for:', email);

      // Validate required fields
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Email and password are required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          profile: true
        }
      });

      console.log('👤 User found:', user ? 'Yes' : 'No');

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid email or password',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: 'error',
          message: 'Account is deactivated. Please contact support.',
          code: RESPONSE_CODES.FORBIDDEN
        });
      }

      // Check if account is locked - FIXED: Call the static method
      const isLocked = await AuthController.isAccountLocked(email);
      if (isLocked) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: 'error',
          message: 'Account is locked due to multiple failed attempts. Please try again after 15 minutes.',
          code: RESPONSE_CODES.FORBIDDEN
        });
      }

      // Check password
      let isValidPassword = false;
      try {
        isValidPassword = await bcrypt.compare(password, user.passwordHash);
        console.log('🔐 Password check:', isValidPassword ? 'Valid' : 'Invalid');
      } catch (bcryptError) {
        console.error('❌ Bcrypt error:', bcryptError);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Authentication error. Please try again.',
          code: RESPONSE_CODES.ERROR
        });
      }

      if (!isValidPassword) {
        // Track failed login attempt - FIXED: Call the static method
        await AuthController.trackFailedLogin(email);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid email or password',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      // Clear failed login attempts on successful login
      await redis.del(`failed_login:${email.toLowerCase()}`);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          tokenVersion: { increment: 1 }
        }
      });

      // Generate tokens
      const accessToken = Helpers.generateJWT(user.id);
      const refreshToken = crypto.randomBytes(40).toString('hex');

      // Store refresh token in Redis
      await redis.set(
        `refresh_token:${user.id}:${refreshToken}`,
        'true',
        7 * 24 * 60 * 60 // 7 days
      );

      // Remove sensitive data
      const { passwordHash: _, ...userData } = user;

      // Log login
      logger.info('User logged in', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: userData,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('❌ Login error details:', error);
      logger.error('Login error:', error);
      
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Login failed. Please try again later.',
        code: RESPONSE_CODES.ERROR,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Refresh token is required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Find refresh token in Redis
      const keys = await redis.keys(`refresh_token:*:${refreshToken}`);
      if (keys.length === 0) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid or expired refresh token',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      // Extract userId from key pattern: refresh_token:{userId}:{refreshToken}
      const userId = keys[0].split(':')[1];

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'User not found',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      // Generate new tokens
      const newAccessToken = Helpers.generateJWT(user.id);
      const newRefreshToken = crypto.randomBytes(40).toString('hex');

      // Delete old refresh token
      await redis.del(keys[0]);

      // Store new refresh token
      await redis.set(
        `refresh_token:${user.id}:${newRefreshToken}`,
        'true',
        7 * 24 * 60 * 60 // 7 days
      );

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Token refresh failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      const token = req.token;
      const userId = req.user.id;

      // Blacklist token
      await redis.set(
        `blacklist:${token}`,
        'true',
        parseInt(process.env.JWT_EXPIRE) * 60
      );

      // Remove all refresh tokens for this user
      await redis.deletePattern(`refresh_token:${userId}:*`);

      logger.info('User logged out', {
        userId,
        email: req.user.email,
        ip: req.ip
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Logout failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid or expired verification token',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      });

      logger.info('Email verified successfully', {
        userId: user.id,
        email: user.email
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Email verification failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Request password reset
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Email is required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal if email exists for security
        return res.status(HTTP_STATUS.OK).json({
          status: 'success',
          message: 'If an account exists with this email, you will receive a password reset link.'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        }
      });

      // Send reset email
      emailService.sendPasswordResetEmail(user, resetToken).catch(err => {
        console.error('Failed to send password reset email:', err);
      });

      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Password reset request failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Password must be at least 8 characters',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid or expired reset token',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          tokenVersion: { increment: 1 } // Invalidate all existing tokens
        }
      });

      // Blacklist all tokens for this user
      await redis.deletePattern(`refresh_token:${user.id}:*`);

      logger.info('Password reset successful', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Password reset failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Change password (authenticated)
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Current password and new password are required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      if (newPassword.length < 8) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'New password must be at least 8 characters',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Current password is incorrect',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'New password must be different from current password',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 } // Invalidate all existing tokens
        }
      });

      // Blacklist all tokens for this user
      await redis.deletePattern(`refresh_token:${userId}:*`);

      logger.info('Password changed successfully', {
        userId,
        email: user.email,
        ip: req.ip
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Password change failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true,
          addresses: {
            orderBy: { isDefault: 'desc' }
          }
        }
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'User not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const { passwordHash: _, ...userData } = user;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: userData
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get profile',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const { name, phone, bio, preferredLanguage } = req.body;
      const userId = req.user.id;

      // Validate name if provided
      if (name && name.trim().length < 2) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Name must be at least 2 characters',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name ? name.trim() : undefined,
          phone: phone || null,
          profile: {
            upsert: {
              update: {
                bio: bio || null,
                preferredLanguage: preferredLanguage || 'en'
              },
              create: {
                bio: bio || null,
                preferredLanguage: preferredLanguage || 'en'
              }
            }
          }
        },
        include: {
          profile: true,
          addresses: {
            orderBy: { isDefault: 'desc' }
          }
        }
      });

      const { passwordHash: _, ...userData } = user;

      logger.info('Profile updated successfully', {
        userId,
        email: user.email
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: userData
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Profile update failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Unlock account (admin only)
   */
  static async unlockAccount(req, res) {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Email is required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      const key = `failed_login:${email.toLowerCase()}`;
      await redis.del(key);

      logger.info('Account unlocked', {
        email,
        adminId: req.user.id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Account unlocked successfully'
      });
    } catch (error) {
      logger.error('Unlock account error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to unlock account',
        code: RESPONSE_CODES.ERROR
      });
    }
  }
}

module.exports = AuthController;