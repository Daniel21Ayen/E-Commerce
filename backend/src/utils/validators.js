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
        .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
      
      body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
      
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
        .isMobilePhone().withMessage('Please provide a valid phone number'),
      
      body('address')
        .optional()
        .isObject().withMessage('Address must be an object')
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
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters')
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
        .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters'),
      
      body('sku')
        .trim()
        .notEmpty().withMessage('SKU is required')
        .isLength({ max: 50 }).withMessage('SKU must not exceed 50 characters')
        .matches(/^[A-Z0-9-]+$/).withMessage('SKU must contain only uppercase letters, numbers, and hyphens'),
      
      body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0, max: 999999.99 }).withMessage('Price must be between 0 and 999,999.99'),
      
      body('stockQuantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
      
      body('categoryId')
        .optional()
        .isUUID().withMessage('Invalid category ID format'),
      
      body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
      
      body('attributes')
        .optional()
        .isArray().withMessage('Attributes must be an array')
    ],

    update: [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters'),
      
      body('price')
        .optional()
        .isFloat({ min: 0, max: 999999.99 }).withMessage('Price must be between 0 and 999,999.99'),
      
      body('stockQuantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
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
        .isInt({ min: 1, max: 999 }).withMessage('Quantity must be between 1 and 999'),
      
      body('shippingAddress')
        .isObject().withMessage('Shipping address is required'),
      
      body('shippingAddress.street')
        .trim()
        .notEmpty().withMessage('Street address is required'),
      
      body('shippingAddress.city')
        .trim()
        .notEmpty().withMessage('City is required'),
      
      body('shippingAddress.state')
        .trim()
        .notEmpty().withMessage('State is required'),
      
      body('shippingAddress.zipCode')
        .trim()
        .notEmpty().withMessage('Zip code is required')
        .matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid zip code format'),
      
      body('shippingAddress.country')
        .trim()
        .notEmpty().withMessage('Country is required'),
      
      body('paymentMethod')
        .notEmpty().withMessage('Payment method is required')
        .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'])
        .withMessage('Invalid payment method')
    ]
  };

  /**
   * Review validation rules
   */
  static review = {
    create: [
      body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
      
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
        .matches(/^[A-Z0-9]+$/).withMessage('Promo code must contain only uppercase letters and numbers'),
      
      body('discountType')
        .notEmpty().withMessage('Discount type is required')
        .isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
      
      body('discountValue')
        .notEmpty().withMessage('Discount value is required')
        .isFloat({ min: 0.01, max: 999999.99 }).withMessage('Discount value must be between 0.01 and 999,999.99')
        .custom((value, { req }) => {
          if (req.body.discountType === 'percentage' && value > 100) {
            throw new Error('Percentage discount cannot exceed 100%');
          }
          return true;
        }),
      
      body('expiryDate')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .toDate()
        .custom((value) => {
          if (value && new Date(value) < new Date()) {
            throw new Error('Expiry date cannot be in the past');
          }
          return true;
        })
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
    /**
     * Validate email format
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
     * Validate password strength
     */
    isStrongPassword: (password) => {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return strongRegex.test(password);
    }
  };

  /**
   * Sanitization helpers
   */
  static sanitize = {
    /**
     * Sanitize HTML content
     */
    sanitizeHtml: (value) => {
      if (!value) return value;
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
    },

    /**
     * Sanitize email
     */
    sanitizeEmail: (email) => {
      if (!email) return '';
      return email.trim().toLowerCase();
    }
  };
}

module.exports = Validators;