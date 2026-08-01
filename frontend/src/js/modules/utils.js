/**
 * Utils Module - Helper functions used across the application
 */

/**
 * Show notification
 */
export const showNotification = (message, type = 'info', duration = 3000) => {
  const container = document.getElementById('notification-container');
  if (!container) {
    // Create container if it doesn't exist
    const newContainer = document.createElement('div');
    newContainer.id = 'notification-container';
    newContainer.style.position = 'fixed';
    newContainer.style.top = '20px';
    newContainer.style.right = '20px';
    newContainer.style.zIndex = '9999';
    newContainer.style.maxWidth = '400px';
    document.body.appendChild(newContainer);
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
    color: white;
    padding: 16px 20px;
    margin-bottom: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    position: relative;
    opacity: 0;
    transform: translateX(100%);
  `;

  notification.textContent = message;

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.7;
    padding: 0 5px;
  `;
  closeBtn.addEventListener('click', () => {
    removeNotification(notification);
  });
  notification.appendChild(closeBtn);

  // Add to container
  const containerEl = document.getElementById('notification-container');
  containerEl.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }
};

/**
 * Remove notification
 */
const removeNotification = (notification) => {
  if (!notification.parentElement) return;
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(100%)';
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 300);
};

/**
 * Set loading state
 */
export const setLoading = (key) => {
  const element = document.getElementById(`loading-${key}`);
  if (element) {
    element.style.display = 'flex';
  }
  
  // Show global loading
  const globalLoading = document.getElementById('global-loading');
  if (globalLoading && !document.querySelector('.loading-overlay.active')) {
    globalLoading.classList.add('active');
  }
};

/**
 * Remove loading state
 */
export const removeLoading = (key) => {
  const element = document.getElementById(`loading-${key}`);
  if (element) {
    element.style.display = 'none';
  }
  
  // Hide global loading if no other loading states
  const globalLoading = document.getElementById('global-loading');
  if (globalLoading) {
    const activeLoaders = document.querySelectorAll('.loading-overlay:not([style*="display: none"])');
    if (activeLoaders.length === 0) {
      globalLoading.classList.remove('active');
    }
  }
};

/**
 * Format currency - Fixed without i18n
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format date - Fixed without i18n
 */
export const formatDate = (date, options = {}) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(new Date(date));
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Update cart badge
 */
export const updateCartBadge = (count) => {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
};

/**
 * Update wishlist badge
 */
export const updateWishlistBadge = (count) => {
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate star rating HTML
 */
export const generateStars = (rating, max = 5) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = max - fullStars - (halfStar ? 1 : 0);
  
  let html = '';
  
  for (let i = 0; i < fullStars; i++) {
    html += '<i class="fas fa-star"></i>';
  }
  
  if (halfStar) {
    html += '<i class="fas fa-star-half-alt"></i>';
  }
  
  for (let i = 0; i < emptyStars; i++) {
    html += '<i class="far fa-star"></i>';
  }
  
  return html;
};

/**
 * Get random color
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
};

/**
 * Slugify string
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Parse query string
 */
export const parseQueryString = (url) => {
  const params = new URLSearchParams(url.split('?')[1] || '');
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

/**
 * Build query string
 */
export const buildQueryString = (params) => {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      urlParams.append(key, value);
    }
  }
  const query = urlParams.toString();
  return query ? `?${query}` : '';
};

/**
 * Copy to clipboard - Fixed without i18n
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Copied to clipboard!', 'success');
    return true;
  }
};

/**
 * Get device info
 */
export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad|Android|Tablet/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    platform: navigator.platform,
    userAgent: ua
  };
};

/**
 * Detect browser
 */
export const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  if (ua.indexOf('Opera') > -1) return 'Opera';
  return 'Unknown';
};

/**
 * Get image placeholder
 */
export const getImagePlaceholder = (width = 400, height = 400, text = '') => {
  return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
};

/**
 * Validate phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-()]{10,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get image alt text
 */
export const getImageAlt = (product, index = 0) => {
  if (!product) return '';
  if (product.images && product.images[index]?.altText) {
    return product.images[index].altText;
  }
  return product.name || 'Product image';
};

/**
 * Generate meta tags
 */
export const generateMetaTags = (title, description, image, url) => {
  const baseTitle = title ? `${title} | E-Shop` : 'E-Shop';
  const baseDescription = description || 'Your one-stop shop for all your needs';
  const baseImage = image || '/default-og-image.jpg';
  const baseUrl = url || window.location.href;

  return {
    title: baseTitle,
    description: baseDescription,
    'og:title': baseTitle,
    'og:description': baseDescription,
    'og:image': baseImage,
    'og:url': baseUrl,
    'og:type': 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': baseTitle,
    'twitter:description': baseDescription,
    'twitter:image': baseImage
  };
};

/**
 * Scroll to top
 */
export const scrollToTop = (behavior = 'smooth') => {
  window.scrollTo({
    top: 0,
    behavior
  });
};

/**
 * Get current scroll position
 */
export const getScrollPosition = () => {
  return {
    x: window.scrollX,
    y: window.scrollY
  };
};

/**
 * Is element in viewport
 */
export const isInViewport = (element, offset = 0) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
};

/**
 * Create DOM element
 */
export const createElement = (tag, className = '', innerHTML = '', attributes = {}) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
};

/**
 * Get cart item count from localStorage
 */
export const getCartCount = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce((total, item) => total + item.quantity, 0);
  } catch {
    return 0;
  }
};

/**
 * Get wishlist count from localStorage
 */
export const getWishlistCount = () => {
  try {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wishlist.length;
  } catch {
    return 0;
  }
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

/**
 * Sleep/Delay function
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  return Object.keys(obj).length === 0;
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Sort array by key
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

/**
 * Get unique values from array
 */
export const unique = (array) => {
  return [...new Set(array)];
};

/**
 * Chunk array into smaller arrays
 */
export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export default {
  showNotification,
  setLoading,
  removeLoading,
  formatCurrency,
  formatDate,
  debounce,
  throttle,
  updateCartBadge,
  updateWishlistBadge,
  formatFileSize,
  generateStars,
  getRandomColor,
  truncateText,
  slugify,
  parseQueryString,
  buildQueryString,
  copyToClipboard,
  getDeviceInfo,
  getBrowser,
  getImagePlaceholder,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  getImageAlt,
  generateMetaTags,
  scrollToTop,
  getScrollPosition,
  isInViewport,
  createElement,
  getCartCount,
  getWishlistCount,
  formatNumber,
  getInitials,
  generateId,
  sleep,
  retry,
  deepClone,
  isEmpty,
  groupBy,
  sortBy,
  unique,
  chunk
};