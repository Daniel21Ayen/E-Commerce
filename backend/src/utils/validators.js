// backend/src/utils/validators.js

const { body, param, query, validationResult } = require('express-validator');

class Validators {
  /**
   * User validation rules
   */
  static user = {
    register: [
      body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name contains invalid characters'),
      
      body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters')
        .custom(async (email) => {
          // Check if email already exists (for registration)
          const { prisma } = require('../config/database');
          const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
          });
          if (existingUser) {
            throw new Error('Email already registered');
          }
          return true;
        }),
      
      body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
        .custom((value) => {
          // Check for common passwords
          const commonPasswords = ['password123', 'admin123', 'qwerty123', 'letmein', '12345678', 'password', '123456789'];
          if (commonPasswords.includes(value.toLowerCase())) {
            throw new Error('Password is too common. Please choose a stronger password');
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

    login: [
      body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .notEmpty().withMessage('Password is required')
    ],

updateProfile: [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name contains invalid characters'),
      
      body('phone')
        .optional()
        .trim()
        .isMobilePhone().withMessage('Please provide a valid phone number'),
      
      body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
      
      body('preferredLanguage')
        .optional()
        .trim()
        .isLength({ max: 10 }).withMessage('Preferred language must not exceed 10 characters'),
      
      body('avatarUrl')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Avatar URL must not exceed 500 characters'),
      
      body('dateOfBirth')
        .optional()
        .isISO8601().withMessage('Date of birth must be a valid date')
        .toDate()
        .custom((value) => {
          if (value && new Date(value) > new Date()) {
            throw new Error('Date of birth cannot be in the future');
          }
          return true;
        }),
      
      body('gender')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Gender must not exceed 20 characters')
    ],

    address: {
      create: [
        body('street')
          .trim()
          .notEmpty().withMessage('Street is required')
          .isLength({ max: 255 }).withMessage('Street must not exceed 255 characters'),
        
        body('city')
          .trim()
          .notEmpty().withMessage('City is required')
          .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
        
        body('state')
          .trim()
          .notEmpty().withMessage('State is required')
          .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
        
        body('zipCode')
          .trim()
          .notEmpty().withMessage('Zip code is required')
          .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code format'),
        
        body('country')
          .trim()
          .notEmpty().withMessage('Country is required')
          .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
        
        body('addressType')
          .optional()
          .trim()
          .isIn(['shipping', 'billing']).withMessage('Address type must be shipping or billing'),
        
        body('isDefault')
          .optional()
          .isBoolean().withMessage('isDefault must be a boolean')
          .toBoolean()
      ],
      update: [
        body('street')
          .optional()
          .trim()
          .isLength({ max: 255 }).withMessage('Street must not exceed 255 characters'),
        
        body('city')
          .optional()
          .trim()
          .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
        
        body('state')
          .optional()
          .trim()
          .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
        
        body('zipCode')
          .optional()
          .trim()
          .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code format'),
        
        body('country')
          .optional()
          .trim()
          .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
        
        body('addressType')
          .optional()
          .trim()
          .isIn(['shipping', 'billing']).withMessage('Address type must be shipping or billing'),
        
        body('isDefault')
          .optional()
          .isBoolean().withMessage('isDefault must be a boolean')
          .toBoolean()
      ]
    }
  };

/**
   * Cart validation rules
   */
  static cart = {
    addItem: [
      body('productId')
        .notEmpty().withMessage('Product ID is required')
        .isUUID().withMessage('Invalid product ID format'),

      body('quantity')
        .optional()
        .isInt({ min: 1, max: 999 }).withMessage('Quantity must be between 1 and 999')
        .toInt(),

      body('variantId')
        .optional()
        .isUUID().withMessage('Invalid variant ID format')
    ]
  };

  /**
   * Product validation rules
   */
  static product = {
    create: [
      body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-.,!?'"()&]+$/).withMessage('Product name contains invalid characters'),
      
      body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
        .isLength({ max: 100 }).withMessage('Slug must not exceed 100 characters'),
      
      body('sku')
        .trim()
        .notEmpty().withMessage('SKU is required')
        .isLength({ max: 50 }).withMessage('SKU must not exceed 50 characters')
        .matches(/^[A-Z0-9-]+$/).withMessage('SKU must contain only uppercase letters, numbers, and hyphens')
        .custom(async (sku) => {
          const { prisma } = require('../config/database');
          const existingProduct = await prisma.product.findUnique({
            where: { sku }
          });
          if (existingProduct) {
            throw new Error('SKU already exists');
          }
          return true;
        }),
      
      body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0.01, max: 999999.99 }).withMessage('Price must be between 0.01 and 999,999.99')
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
      
      body('stockQuantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
        .toInt(),
      
      body('lowStockThreshold')
        .optional()
        .isInt({ min: 0 }).withMessage('Low stock threshold must be a non-negative integer')
        .toInt(),
      
      body('categoryId')
        .optional()
        .isUUID().withMessage('Invalid category ID format'),
      
      body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
      
      body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
        .toBoolean(),
      
      body('isFeatured')
        .optional()
        .isBoolean().withMessage('isFeatured must be a boolean')
        .toBoolean(),
      
      body('attributes')
        .optional()
        .isArray().withMessage('Attributes must be an array'),
      
      body('attributes.*.name')
        .optional()
        .trim()
        .notEmpty().withMessage('Attribute name is required')
        .isLength({ max: 50 }).withMessage('Attribute name must not exceed 50 characters'),
      
      body('attributes.*.value')
        .optional()
        .trim()
        .notEmpty().withMessage('Attribute value is required')
        .isLength({ max: 100 }).withMessage('Attribute value must not exceed 100 characters'),
      
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
        .toInt()
    ],

    update: [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters'),
      
      body('price')
        .optional()
        .isFloat({ min: 0.01, max: 999999.99 }).withMessage('Price must be between 0.01 and 999,999.99')
        .toFloat(),
      
      body('stockQuantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
        .toInt()
    ]
  };

  /**
   * Order validation rules
   */
  static order = {
    create: [
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
        .isLength({ max: 255 }).withMessage('Street must not exceed 255 characters'),
      
      body('shippingAddress.city')
        .trim()
        .notEmpty().withMessage('City is required')
        .isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
      
      body('shippingAddress.state')
        .trim()
        .notEmpty().withMessage('State is required')
        .isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
      
      body('shippingAddress.zipCode')
        .trim()
        .notEmpty().withMessage('Zip code is required')
        .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code format'),
      
      body('shippingAddress.country')
        .trim()
        .notEmpty().withMessage('Country is required')
        .isLength({ max: 100 }).withMessage('Country must not exceed 100 characters'),
      
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
    ]
  };

  /**
   * Review validation rules
   */
  static review = {
    create: [
      body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
        .toInt(),
      
      body('title')
        .trim()
        .notEmpty().withMessage('Review title is required')
        .isLength({ min: 3, max: 100 }).withMessage('Review title must be between 3 and 100 characters'),
      
      body('description')
        .trim()
        .notEmpty().withMessage('Review description is required')
        .isLength({ min: 10, max: 500 }).withMessage('Review description must be between 10 and 500 characters')
    ]
  };

  /**
   * Promo code validation rules
   */
  static promoCode = {
    create: [
      body('code')
        .trim()
        .notEmpty().withMessage('Promo code is required')
        .isLength({ min: 3, max: 20 }).withMessage('Promo code must be between 3 and 20 characters')
        .matches(/^[A-Z0-9]+$/).withMessage('Promo code must contain only uppercase letters and numbers')
        .custom(async (code) => {
          const { prisma } = require('../config/database');
          const existingCode = await prisma.promoCode.findUnique({
            where: { code }
          });
          if (existingCode) {
            throw new Error('Promo code already exists');
          }
          return true;
        }),
      
      body('description')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Description must not exceed 255 characters'),
      
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
      
      body('usageLimit')
        .optional()
        .isInt({ min: 1 }).withMessage('Usage limit must be at least 1')
        .toInt(),
      
      body('perUserLimit')
        .optional()
        .isInt({ min: 1 }).withMessage('Per-user limit must be at least 1')
        .toInt(),
      
      body('startsAt')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .toDate(),
      
      body('expiresAt')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .toDate()
        .custom((value, { req }) => {
          if (value && req.body.startsAt && new Date(value) < new Date(req.body.startsAt)) {
            throw new Error('Expiry date must be after start date');
          }
          if (value && new Date(value) < new Date()) {
            throw new Error('Expiry date cannot be in the past');
          }
          return true;
        }),
      
      body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean')
        .toBoolean()
    ]
  };

  /**
   * Pagination validation rules
   */
  static pagination = [
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
  ];

  /**
   * Search validation rules
   */
  static search = [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
    
    query('categoryId')
      .optional()
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
  ];

  /**
   * Validate request
   */
  static validate(validations) {
    return async (req, res, next) => {
      try {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
          return next();
        }

        const formattedErrors = errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value,
          location: err.location
        }));

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors,
          code: 'VALIDATION_ERROR'
        });
      } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Validation processing failed',
          code: 'VALIDATION_PROCESSING_ERROR'
        });
      }
    };
  }

  /**
   * Custom validators
   */
  static custom = {
    isValidEmail: (email) => {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      return emailRegex.test(email);
    },

    isValidPhone: (phone) => {
      const phoneRegex = /^\+?[\d\s\-()]{10,20}$/;
      return phoneRegex.test(phone);
    },

    isValidUrl: (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    isValidDateRange: (startDate, endDate) => {
      if (!startDate || !endDate) return true;
      return new Date(startDate) <= new Date(endDate);
    },

    isStrongPassword: (password) => {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return strongRegex.test(password);
    }
  };

  /**
   * Sanitization helpers
   */
  static sanitize = {
    sanitizeHtml: (value) => {
      if (!value) return value;
      return value
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/[^\w\s.,!?@\-]/g, '')
        .trim();
    },

    sanitizeSearchQuery: (value) => {
      if (!value) return '';
      return value
        .replace(/[^\w\s\-]/g, '')
        .trim()
        .slice(0, 100);
    },

    sanitizeFilename: (filename) => {
      if (!filename) return '';
      return filename
        .replace(/[^\w\s.-]/g, '')
        .replace(/\s+/g, '_')
        .trim();
    },

    sanitizeEmail: (email) => {
      if (!email) return '';
      return email.trim().toLowerCase();
    }
  };
}

module.exports = Validators;