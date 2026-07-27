const { body, param, query, validationResult, matchedData, sanitize } = require('express-validator');
const { logger } = require('./logger');

/**
 * Validation Middleware
 * Comprehensive validation with sanitization
 */
class ValidationMiddleware {
  /**
   * Validate request against validation rules
   */
  static validate(validations) {
    return async (req, res, next) => {
      try {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        // Check for validation errors
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
          // Sanitize and store validated data
          req.validatedData = matchedData(req);
          return next();
        }

        // Format errors
        const formattedErrors = errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value,
          location: err.location
        }));

        // Log validation errors
        logger.warn('Validation failed', {
          errors: formattedErrors,
          path: req.path,
          method: req.method,
          ip: req.ip,
          userId: req.user?.id
        });

        // Return validation error response
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors,
          code: 'VALIDATION_ERROR'
        });
      } catch (error) {
        logger.error('Validation middleware error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Validation processing failed.',
          code: 'VALIDATION_PROCESSING_ERROR'
        });
      }
    };
  }

  /**
   * Validation Rules
   */
  static rules = {
    // User Registration
    register: [
      body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name contains invalid characters')
        .escape(),
      
      body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters')
        .custom(async (email) => {
          // Check if email already exists
          const { prisma } = require('../config/database');
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });
          if (existingUser) {
            throw new Error('Email already registered');
          }
          return true;
        }),
      
      body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .isLength({ max: 100 }).withMessage('Password must not exceed 100 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
        .custom((value) => {
          // Check for common passwords
          const commonPasswords = ['password123', 'admin123', 'qwerty123', 'letmein'];
          if (commonPasswords.includes(value.toLowerCase())) {
            throw new Error('Password is too common');
          }
          return true;
        }),
      
      body('confirmPassword')
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords do not match');
          }
          return true;
        }),
      
      body('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please provide a valid phone number')
        .matches(/^\+?[\d\s\-()]+$/).withMessage('Phone number contains invalid characters'),
      
      body('address')
        .optional()
        .isObject().withMessage('Address must be an object'),
      
      body('address.street')
        .optional()
        .trim()
        .notEmpty().withMessage('Street is required when address is provided')
        .isLength({ max: 255 }).withMessage('Street must not exceed 255 characters'),
      
      body('address.city')
        .optional()
        .trim()
        .notEmpty().withMessage('City is required when address is provided')
        .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
      
      body('address.state')
        .optional()
        .trim()
        .notEmpty().withMessage('State is required when address is provided')
        .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
      
      body('address.zipCode')
        .optional()
        .trim()
        .notEmpty().withMessage('Zip code is required when address is provided')
        .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code format'),
      
      body('address.country')
        .optional()
        .trim()
        .notEmpty().withMessage('Country is required when address is provided')
        .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters')
    ],

    // User Login
    login: [
      body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],

    // Update Profile
    updateProfile: [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name contains invalid characters')
        .escape(),
      
      body('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please provide a valid phone number')
        .matches(/^\+?[\d\s\-()]+$/).withMessage('Phone number contains invalid characters'),
      
      body('address')
        .optional()
        .isObject().withMessage('Address must be an object'),
      
      body('address.street')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Street must not exceed 255 characters'),
      
      body('address.city')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
      
      body('address.state')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
      
      body('address.zipCode')
        .optional()
        .trim()
        .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code format'),
      
      body('address.country')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
      
      body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters')
        .escape()
    ],

    // Product Validation
    product: [
      body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-.,!?'"()&]+$/).withMessage('Product name contains invalid characters')
        .escape(),
      
      body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
        .isLength({ max: 100 }).withMessage('Slug must not exceed 100 characters'),
      
      body('sku')
        .trim()
        .notEmpty().withMessage('SKU is required')
        .isLength({ max: 50 }).withMessage('SKU must not exceed 50 characters')
        .matches(/^[A-Z0-9-]+$/).withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),
      
      body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters')
        .escape(),
      
      body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0, max: 999999.99 }).withMessage('Price must be between 0 and 999,999.99')
        .toFloat(),
      
      body('comparePrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Compare price must be a positive number')
        .toFloat()
        .custom((value, { req }) => {
          if (value && parseFloat(value) < parseFloat(req.body.price)) {
            throw new Error('Compare price must be greater than regular price');
          }
          return true;
        }),
      
      body('categoryId')
        .optional()
        .isUUID().withMessage('Invalid category ID format'),
      
      body('brand')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Brand must not exceed 100 characters')
        .escape(),
      
      body('stockQuantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
        .toInt(),
      
      body('lowStockThreshold')
        .optional()
        .isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer')
        .toInt(),
      
      body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
        .toBoolean(),
      
      body('isFeatured')
        .optional()
        .isBoolean().withMessage('isFeatured must be a boolean')
        .toBoolean(),
      
      body('weight')
        .optional()
        .isFloat({ min: 0 }).withMessage('Weight must be a positive number')
        .toFloat(),
      
      body('dimensions')
        .optional()
        .isObject().withMessage('Dimensions must be an object'),
      
      body('dimensions.length')
        .optional()
        .isFloat({ min: 0 }).withMessage('Length must be a positive number')
        .toFloat(),
      
      body('dimensions.width')
        .optional()
        .isFloat({ min: 0 }).withMessage('Width must be a positive number')
        .toFloat(),
      
      body('dimensions.height')
        .optional()
        .isFloat({ min: 0 }).withMessage('Height must be a positive number')
        .toFloat(),
      
      body('attributes')
        .optional()
        .isArray().withMessage('Attributes must be an array'),
      
      body('attributes.*.name')
        .optional()
        .trim()
        .notEmpty().withMessage('Attribute name is required')
        .isLength({ max: 50 }).withMessage('Attribute name must not exceed 50 characters')
        .escape(),
      
      body('attributes.*.value')
        .optional()
        .trim()
        .notEmpty().withMessage('Attribute value is required')
        .isLength({ max: 100 }).withMessage('Attribute value must not exceed 100 characters')
        .escape(),
      
      body('variants')
        .optional()
        .isArray().withMessage('Variants must be an array'),
      
      body('variants.*.sku')
        .optional()
        .trim()
        .notEmpty().withMessage('Variant SKU is required')
        .matches(/^[A-Z0-9-]+$/).withMessage('Variant SKU must contain only uppercase letters, numbers, and hyphens'),
      
      body('variants.*.price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Variant price must be a positive number')
        .toFloat(),
      
      body('variants.*.stockQuantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Variant stock quantity must be a non-negative integer')
        .toInt(),
      
      body('variants.*.attributes')
        .optional()
        .isObject().withMessage('Variant attributes must be an object')
    ],

    // Order Validation
    order: [
      body('items')
        .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
      
      body('items.*.productId')
        .notEmpty().withMessage('Product ID is required')
        .isUUID().withMessage('Invalid product ID format'),
      
      body('items.*.quantity')
        .isInt({ min: 1, max: 999 }).withMessage('Quantity must be between 1 and 999')
        .toInt(),
      
      body('items.*.variantId')
        .optional()
        .isUUID().withMessage('Invalid variant ID format'),
      
      body('shippingAddress')
        .isObject().withMessage('Shipping address is required'),
      
      body('shippingAddress.street')
        .trim()
        .notEmpty().withMessage('Street address is required')
        .isLength({ max: 255 }).withMessage('Street must not exceed 255 characters')
        .escape(),
      
      body('shippingAddress.city')
        .trim()
        .notEmpty().withMessage('City is required')
        .isLength({ max: 100 }).withMessage('City must not exceed 100 characters')
        .escape(),
      
      body('shippingAddress.state')
        .trim()
        .notEmpty().withMessage('State is required')
        .isLength({ max: 100 }).withMessage('State must not exceed 100 characters')
        .escape(),
      
      body('shippingAddress.zipCode')
        .trim()
        .notEmpty().withMessage('Zip code is required')
        .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code format'),
      
      body('shippingAddress.country')
        .trim()
        .notEmpty().withMessage('Country is required')
        .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters')
        .escape(),
      
      body('billingAddress')
        .optional()
        .isObject().withMessage('Billing address must be an object'),
      
      body('paymentMethod')
        .notEmpty().withMessage('Payment method is required')
        .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'])
        .withMessage('Invalid payment method'),
      
      body('promoCode')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Promo code must not exceed 50 characters')
        .matches(/^[A-Z0-9]+$/).withMessage('Promo code must contain only uppercase letters and numbers'),
      
      body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
        .escape()
    ],

    // Review Validation
    review: [
      body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
        .toInt(),
      
      body('title')
        .trim()
        .notEmpty().withMessage('Review title is required')
        .isLength({ min: 3, max: 100 }).withMessage('Review title must be between 3 and 100 characters')
        .escape(),
      
      body('description')
        .trim()
        .notEmpty().withMessage('Review description is required')
        .isLength({ min: 10, max: 500 }).withMessage('Review description must be between 10 and 500 characters')
        .escape()
    ],

    // Promo Code Validation
    promoCode: [
      body('code')
        .trim()
        .notEmpty().withMessage('Promo code is required')
        .isLength({ min: 3, max: 20 }).withMessage('Promo code must be between 3 and 20 characters')
        .matches(/^[A-Z0-9]+$/).withMessage('Promo code must contain only uppercase letters and numbers'),
      
      body('discountType')
        .notEmpty().withMessage('Discount type is required')
        .isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
      
      body('discountValue')
        .notEmpty().withMessage('Discount value is required')
        .isFloat({ min: 0.01, max: 999999.99 }).withMessage('Discount value must be between 0.01 and 999,999.99')
        .toFloat()
        .custom((value, { req }) => {
          if (req.body.discountType === 'percentage' && value > 100) {
            throw new Error('Percentage discount cannot exceed 100%');
          }
          return true;
        }),
      
      body('minPurchase')
        .optional()
        .isFloat({ min: 0 }).withMessage('Minimum purchase must be a positive number')
        .toFloat(),
      
      body('maxDiscount')
        .optional()
        .isFloat({ min: 0 }).withMessage('Maximum discount must be a positive number')
        .toFloat(),
      
      body('expiryDate')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .toDate()
        .custom((value) => {
          if (value && new Date(value) < new Date()) {
            throw new Error('Expiry date cannot be in the past');
          }
          return true;
        }),
      
      body('usageLimit')
        .optional()
        .isInt({ min: 1 }).withMessage('Usage limit must be at least 1')
        .toInt(),
      
      body('perUserLimit')
        .optional()
        .isInt({ min: 1 }).withMessage('Per-user limit must be at least 1')
        .toInt(),
      
      body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
        .toBoolean()
    ],

    // Pagination
    pagination: [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt(),
      
      query('sortBy')
        .optional()
        .trim()
        .isString().withMessage('Sort by must be a string'),
      
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
        .toLowerCase()
    ],

    // Search
    search: [
      query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters')
        .escape(),
      
      query('category')
        .optional()
        .trim()
        .isUUID().withMessage('Invalid category ID format'),
      
      query('minPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Minimum price must be a positive number')
        .toFloat(),
      
      query('maxPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Maximum price must be a positive number')
        .toFloat()
        .custom((value, { req }) => {
          if (req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
            throw new Error('Maximum price must be greater than minimum price');
          }
          return true;
        }),
      
      query('rating')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
        .toInt(),
      
      query('inStock')
        .optional()
        .isBoolean().withMessage('inStock must be a boolean')
        .toBoolean()
    ],

    // File Upload
    upload: [
      body('altText')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Alt text must not exceed 255 characters')
        .escape(),
      
      body('isPrimary')
        .optional()
        .isBoolean().withMessage('isPrimary must be a boolean')
        .toBoolean(),
      
      body('sortOrder')
        .optional()
        .isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer')
        .toInt()
    ]
  };

  /**
   * Custom Validators
   */
  static custom = {
    /**
     * Validate email format with additional checks
     */
    isValidEmail: (email) => {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      return emailRegex.test(email);
    },

    /**
     * Validate phone number
     */
    isValidPhone: (phone) => {
      const phoneRegex = /^\+?[\d\s\-()]{10,20}$/;
      return phoneRegex.test(phone);
    },

    /**
     * Validate URL
     */
    isValidUrl: (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Validate date range
     */
    isValidDateRange: (startDate, endDate) => {
      if (!startDate || !endDate) return true;
      return new Date(startDate) <= new Date(endDate);
    },

    /**
     * Check if value is in enum
     */
    isInEnum: (value, enumValues) => {
      return enumValues.includes(value);
    }
  };

  /**
   * Sanitization Helpers
   */
  static sanitize = {
    /**
     * Sanitize HTML content
     */
    sanitizeHtml: (value) => {
      if (!value) return value;
      // Basic HTML sanitization
      return value
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[^\w\s.,!?@\-]/g, '')
        .trim();
    },

    /**
     * Sanitize search query
     */
    sanitizeSearchQuery: (value) => {
      if (!value) return '';
      return value
        .replace(/[^\w\s\-]/g, '')
        .trim()
        .slice(0, 100);
    },

    /**
     * Sanitize filename
     */
    sanitizeFilename: (filename) => {
      if (!filename) return '';
      return filename
        .replace(/[^\w\s.-]/g, '')
        .replace(/\s+/g, '_')
        .trim();
    }
  };
}

module.exports = ValidationMiddleware;