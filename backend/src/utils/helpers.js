// backend/src/utils/helpers.js

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class Helpers {
  /**
   * Generate unique ID
   */
  static generateId() {
    return uuidv4();
  }

  /**
   * Generate short ID
   */
  static generateShortId(length = 8) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate order number
   */
  static generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
  }

  /**
   * Generate SKU
   */
  static generateSKU(productName, category = 'GEN') {
    const prefix = productName
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `${category}-${prefix}${timestamp}${random}`;
  }

  /**
   * Calculate discount
   */
  static calculateDiscount(price, discountPercent) {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    return price * (discountPercent / 100);
  }

  /**
   * Calculate tax
   */
  static calculateTax(amount, taxRate) {
    if (taxRate < 0) {
      throw new Error('Tax rate must be greater than 0');
    }
    return amount * (taxRate / 100);
  }

  /**
   * Format currency
   */
  static formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).format(format);
  }

  /**
   * Format date relative
   */
  static formatRelativeDate(date) {
    return moment(date).fromNow();
  }

  /**
   * Truncate text
   */
  static truncateText(text, length = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  }

  /**
   * Slugify string
   */
  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Generate random string
   */
  static randomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate JWT - FIXED
   */
  static generateJWT(userId, expiresIn = null) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      
      const expires = expiresIn || process.env.JWT_EXPIRE || '30d';
      
      return jwt.sign(
        { id: userId },
        secret,
        { expiresIn: expires }
      );
    } catch (error) {
      console.error('JWT Generation Error:', error.message);
      throw new Error(`Failed to generate JWT: ${error.message}`);
    }
  }

  /**
   * Verify JWT
   */
  static verifyJWT(token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      return jwt.verify(token, secret);
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return null;
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Password Hashing Error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare password
   */
  static async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Password Comparison Error:', error);
      return false;
    }
  }

  /**
   * Parse pagination params
   */
  static parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    return {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };
  }

  /**
   * Build search filter for Prisma
   */
  static buildSearchFilter(query, fields) {
    const filter = {};
    
    if (query.search) {
      filter.OR = fields.map(field => ({
        [field]: { contains: query.search, mode: 'insensitive' }
      }));
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) filter.price.lte = parseFloat(query.maxPrice);
    }

    if (query.rating) {
      filter.averageRating = { gte: parseFloat(query.rating) };
    }

    if (query.inStock !== undefined) {
      filter.stockQuantity = query.inStock === 'true' ? { gt: 0 } : { eq: 0 };
    }

    return filter;
  }

  /**
   * Validate email
   */
  static isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone
   */
  static isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s\-()]{10,20}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Group array by key
   */
  static groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }

  /**
   * Sort array by key
   */
  static sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  /**
   * Unique array
   */
  static unique(array) {
    return [...new Set(array)];
  }

  /**
   * Chunk array
   */
  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Pick object properties
   */
  static pick(obj, keys) {
    return keys.reduce((result, key) => {
      if (obj && obj[key] !== undefined) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  }

  /**
   * Omit object properties
   */
  static omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }

  /**
   * Deep clone
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Sleep
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function
   */
  static async retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await this.sleep(delay);
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Get client IP
   */
  static getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.connection?.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * Get user agent
   */
  static getUserAgent(req) {
    return req.get('user-agent') || 'unknown';
  }

  /**
   * Generate meta tags
   */
  static generateMetaTags(title, description, keywords = '') {
    const storeName = process.env.STORE_NAME || 'E-Commerce';
    const storeDescription = process.env.STORE_DESCRIPTION || 'Your one-stop shop';
    const storeKeywords = process.env.STORE_KEYWORDS || 'ecommerce, shop, online store';
    
    return {
      title: title ? `${title} | ${storeName}` : storeName,
      description: description || storeDescription,
      keywords: keywords || storeKeywords,
      ogTitle: title || storeName,
      ogDescription: description || storeDescription,
      ogImage: process.env.STORE_OG_IMAGE || '/default-og-image.jpg',
      ogUrl: process.env.FRONTEND_URL || 'http://localhost:3005'
    };
  }

  /**
   * Generate breadcrumbs
   */
  static generateBreadcrumbs(path) {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Home', url: '/' }
    ];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        url: currentPath
      });
    }

    return breadcrumbs;
  }

  /**
   * Calculate distance
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate random OTP
   */
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Generate random alphanumeric string
   */
  static generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get environment variable with default
   */
  static getEnv(key, defaultValue = null) {
    const value = process.env[key];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Check if environment is production
   */
  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Check if environment is development
   */
  static isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Safe JSON parse
   */
  static safeJsonParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Mask sensitive data
   */
  static maskSensitive(data, fields = ['password', 'token', 'secret']) {
    if (!data) return data;
    
    const masked = { ...data };
    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***';
      }
    });
    return masked;
  }
}

// Export the class
module.exports = { Helpers };