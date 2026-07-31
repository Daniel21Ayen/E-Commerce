require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const path = require('path');
const fs = require('fs');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const uploadMiddleware = require('./middleware/upload');
const logger = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const promoRoutes = require('./routes/promoRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import Redis client
const redis = require('./config/redis');

// Import passport config
require('./config/passport');

const app = express();

// =============================================
// SECURITY MIDDLEWARE
// =============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.cloudinary.com", "https://*.imgix.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression for response bodies
app.use(compression({
  level: 6,
  threshold: 100 * 1024, // 100KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// =============================================
// CORS CONFIGURATION
// =============================================

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Pagination'],
  maxAge: 86400 // 24 hours
}));

// =============================================
// RATE LIMITING
// =============================================

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Allow more requests for authenticated users
    return req.user ? 200 : 100;
  },
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, else IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

app.use('/api', limiter);

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

app.use('/api/auth', authLimiter);

// Stricter rate limiter for sensitive admin endpoints
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    status: 'error',
    message: 'Too many admin requests, please try again later.'
  }
});

app.use('/api/admin', adminLimiter);

// =============================================
// BODY PARSERS
// =============================================

// JSON parser with size limit
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid JSON payload'
      });
      throw new Error('Invalid JSON');
    }
  }
}));

// URL-encoded parser
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 10000
}));

// =============================================
// SESSION CONFIGURATION (for OAuth)
// =============================================

const sessionConfig = {
  secret: process.env.JWT_SECRET || 'session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  store: redis.isConnected ? new RedisStore({
    client: redis.client,
    prefix: 'ecom-session:',
    ttl: 86400 // 24 hours
  }) : undefined
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// =============================================
// PASSPORT INITIALIZATION
// =============================================

app.use(passport.initialize());
app.use(passport.session());

// =============================================
// LOGGING MIDDLEWARE
// =============================================

// Use morgan-based HTTP request logging middleware
if (logger.morgan) {
  app.use(logger.morgan);
}

// =============================================
// STATIC FILES
// =============================================

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '30d',
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg') || filepath.endsWith('.png') || filepath.endsWith('.webp')) {
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
    }
  }
}));

// =============================================
// REQUEST CONTEXT MIDDLEWARE
// =============================================

// Add request ID for tracing
app.use((req, res, next) => {
  req.requestId = require('crypto').randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Add response time header
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    return originalEnd.apply(this, args);
  };
  next();
});

// =============================================
// API ROUTES
// =============================================

// Root API endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'E-Commerce API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      wishlist: '/api/wishlist',
      reviews: '/api/reviews',
      admin: '/api/admin',
      promos: '/api/promos',
      analytics: '/api/analytics'
    },
    documentation: 'http://localhost:5000/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version,
    services: {
      database: 'connected',
      redis: redis.isConnected ? 'connected' : 'disconnected',
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024
      }
    }
  });
});

// API version
app.get('/api/version', (req, res) => {
  res.status(200).json({
    version: '1.0.0',
    name: 'E-Commerce API',
    description: 'Comprehensive E-Commerce REST API'
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);

// =============================================
// FILE UPLOAD ERROR HANDLING
// =============================================

// File upload error handling middleware
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'File upload failed'
    });
  }
  next();
});

// =============================================
// 404 HANDLER
// =============================================

app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// =============================================
// GLOBAL ERROR HANDLER
// =============================================

app.use(errorHandler);

// =============================================
// UNHANDLED REJECTION WARNING
// =============================================

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  if (process.env.NODE_ENV === 'development') {
    // Don't exit in development, just log
  }
});

module.exports = app;