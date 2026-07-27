module.exports = {
  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    CUSTOMER: 'customer',
    VENDOR: 'vendor'
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    FAILED: 'failed'
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    PAYPAL: 'paypal',
    BANK_TRANSFER: 'bank_transfer',
    CASH_ON_DELIVERY: 'cash_on_delivery'
  },

  // Review Status
  REVIEW_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },

  // Promo Code Types
  PROMO_TYPES: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
    FREE_SHIPPING: 'free_shipping'
  },

  // Inventory Reasons
  INVENTORY_REASONS: {
    PURCHASE: 'purchase',
    SALE: 'sale',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
    RESTOCK: 'restock',
    DAMAGE: 'damage'
  },

  // Cache TTL (seconds)
  CACHE_TTL: {
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    DEFAULT: 3600,      // 1 hour
    LONG: 86400,        // 24 hours
    VERY_LONG: 604800,  // 7 days
    SESSION: 86400      // 24 hours
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // File Upload Limits
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },

  // Email Templates
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    ORDER_CONFIRMATION: 'order-confirmation',
    ORDER_STATUS: 'order-status',
    PASSWORD_RESET: 'password-reset',
    ABANDONED_CART: 'abandoned-cart',
    ORDER_TRACKING: 'order-tracking',
    PROMO_CODE: 'promo-code',
    REVIEW_REQUEST: 'review-request',
    LOW_STOCK: 'low-stock',
    PAYMENT_RECEIPT: 'payment-receipt'
  },

  // API Response Codes
  RESPONSE_CODES: {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    RATE_LIMITED: 'RATE_LIMITED',
    SERVER_ERROR: 'SERVER_ERROR',
    PAYMENT_ERROR: 'PAYMENT_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR'
  },

  // Default Shipping Rates
  SHIPPING_RATES: {
    STANDARD: 5.99,
    EXPRESS: 12.99,
    OVERNIGHT: 24.99,
    FREE_THRESHOLD: 50.00
  },

  // Tax Rates
  TAX_RATES: {
    DEFAULT: 0.08, // 8%
    REDUCED: 0.05, // 5%
    ZERO: 0
  },

  // Currency
  CURRENCY: {
    CODE: 'USD',
    SYMBOL: '$',
    LOCALE: 'en-US'
  },

  // Date Formats
  DATE_FORMATS: {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY_DATE: 'MMM DD, YYYY',
    DISPLAY_DATETIME: 'MMM DD, YYYY HH:mm'
  },

  // Redis Keys
  REDIS_KEYS: {
    SESSION: 'session:',
    CACHE: 'cache:',
    QUEUE: 'queue:',
    LOCK: 'lock:',
    RATE_LIMIT: 'rate:',
    BLACKLIST: 'blacklist:',
    PRODUCT: 'product:',
    CATEGORY: 'category:',
    USER: 'user:',
    ORDER: 'order:'
  },

  // Queue Names
  QUEUE_NAMES: {
    EMAIL: 'email_queue',
    PDF: 'pdf_queue',
    NOTIFICATION: 'notification_queue',
    INVENTORY: 'inventory_queue',
    ANALYTICS: 'analytics_queue'
  },

  // Log Levels
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    VERBOSE: 'verbose'
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // Environment
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
    TEST: 'test'
  },

  // Feature Flags
  FEATURES: {
    WISHLIST: true,
    REVIEWS: true,
    PROMO_CODES: true,
    SOCIAL_LOGIN: true,
    MULTI_LANGUAGE: true,
    ANALYTICS: true,
    PDF_INVOICE: true,
    ORDER_TRACKING: true,
    EMAIL_NOTIFICATIONS: true,
    RECENTLY_VIEWED: true,
    AUTOCOMPLETE: true,
    ADVANCED_FILTERS: true
  },

  // Security
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900, // 15 minutes in seconds
    TOKEN_EXPIRY: {
      ACCESS: 3600,    // 1 hour
      REFRESH: 604800, // 7 days
      RESET: 3600,     // 1 hour
      VERIFY: 86400    // 24 hours
    },
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIREMENTS: {
      UPPERCASE: true,
      LOWERCASE: true,
      NUMBER: true,
      SPECIAL_CHAR: false
    }
  },

  // Default Values
  DEFAULTS: {
    LANGUAGE: 'en',
    CURRENCY: 'USD',
    TIMEZONE: 'UTC',
    COUNTRY: 'US',
    PAGE_SIZE: 20
  }
};