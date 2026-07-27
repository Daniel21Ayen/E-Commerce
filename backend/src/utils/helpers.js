const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

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
   * Generate JWT
   */
  static generateJWT(userId, expiresIn = '7d') {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn }
    );
  }

  /**
   * Verify JWT
   */
  static verifyJWT(token) {
    const jwt = require('jsonwebtoken');
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, 10);
  }

  /**
   * Compare password
   */
  static async comparePassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }

  /**
   * Parse pagination params
   */
  static parsePagination(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
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
   * Build search filter
   */
  static buildSearchFilter(query, fields) {
    const filter = {};
    
    if (query.search) {
      filter.$or = fields.map(field => ({
        [field]: { $regex: query.search, $options: 'i' }
      }));
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = parseFloat(query.minPrice);
      if (query.maxPrice) filter.price.$lte = parseFloat(query.maxPrice);
    }

    if (query.rating) {
      filter.averageRating = { $gte: parseFloat(query.rating) };
    }

    if (query.inStock !== undefined) {
      filter.stockQuantity = { [query.inStock ? '$gt' : '$eq']: 0 };
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
    return array.sort((a, b) => {
      if (order === 'asc') {
        return a[key] > b[key] ? 1 : -1;
      } else {
        return a[key] < b[key] ? 1 : -1;
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
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.connection.socket?.remoteAddress;
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
    return {
      title: title ? `${title} | ${process.env.STORE_NAME}` : process.env.STORE_NAME,
      description: description || process.env.STORE_DESCRIPTION,
      keywords: keywords || process.env.STORE_KEYWORDS,
      ogTitle: title || process.env.STORE_NAME,
      ogDescription: description || process.env.STORE_DESCRIPTION,
      ogImage: process.env.STORE_OG_IMAGE || '/default-og-image.jpg',
      ogUrl: process.env.FRONTEND_URL
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
    const R = 6371; // Earth's radius in km
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
}

module.exports = Helpers;