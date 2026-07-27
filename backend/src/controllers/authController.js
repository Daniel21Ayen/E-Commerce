const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const redis = require('../config/redis');
const { logger } = require('../middleware/logger');
const emailService = require('../services/emailService');
const { Helpers } = require('../utils/helpers');
const { SECURITY, RESPONSE_CODES, HTTP_STATUS } = require('../utils/constants');

class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const { email, password, name, phone, address } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          message: 'Email already registered',
          code: RESPONSE_CODES.CONFLICT
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
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

      // Create address if provided
      if (address) {
        await prisma.address.create({
          data: {
            userId: user.id,
            ...address,
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
          resetPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      // Send verification email
      await emailService.sendEmailVerification(user, verificationToken);

      // Send welcome email
      await emailService.sendWelcomeEmail(user);

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
      logger.error('Registration error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Registration failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true
        }
      });

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid credentials',
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

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        // Track failed login attempt
        await this.trackFailedLogin(email);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid credentials',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      // Check if account is locked
      const isLocked = await this.isAccountLocked(email);
      if (isLocked) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: 'error',
          message: 'Account is locked due to multiple failed attempts. Please try again later.',
          code: RESPONSE_CODES.FORBIDDEN
        });
      }

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
        `refresh_token:${user.id}`,
        refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      // Log login
      logger.info('User logged in', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      // Remove sensitive data
      const { passwordHash: _, ...userData } = user;

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
      logger.error('Login error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Login failed',
        code: RESPONSE_CODES.ERROR
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

      // Verify refresh token
      const userId = await redis.get(`refresh_token:${refreshToken}`);
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid refresh token',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

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

      // Update refresh token in Redis
      await redis.del(`refresh_token:${refreshToken}`);
      await redis.set(
        `refresh_token:${newRefreshToken}`,
        user.id,
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

      // Remove refresh token
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

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if email exists
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
      await emailService.sendPasswordResetEmail(user, resetToken);

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
          addresses: true
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

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          phone,
          profile: {
            upsert: {
              update: {
                bio,
                preferredLanguage
              },
              create: {
                bio,
                preferredLanguage
              }
            }
          }
        },
        include: {
          profile: true,
          addresses: true
        }
      });

      const { passwordHash: _, ...userData } = user;

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
   * Track failed login attempts
   */
  static async trackFailedLogin(email) {
    const key = `failed_login:${email}`;
    const attempts = await redis.increment(key);
    await redis.expire(key, 15 * 60); // 15 minutes
    return attempts;
  }

  /**
   * Check if account is locked
   */
  static async isAccountLocked(email) {
    const key = `failed_login:${email}`;
    const attempts = await redis.get(key);
    return parseInt(attempts) >= 5;
  }
}

module.exports = AuthController;