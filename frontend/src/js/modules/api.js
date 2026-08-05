/**
 * API Module - Handles all HTTP requests to the backend
 * Uses axios for HTTP requests with interceptors for authentication
 */

import axios from 'axios';
import { getToken, setToken, removeToken, getRefreshToken, setRefreshToken } from './auth';
import { showNotification } from './utils';

// API Configuration
const API_URL = import.meta.env?.VITE_API_URL || process.env.API_URL || 'http://localhost:5000/api';
const TIMEOUT = 30000;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
// src/js/modules/api.js - Update the response interceptor

// Response interceptor - FIXED
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.response?.status} ${error.response?.config?.url}`, error.response?.data);
    }

    // Check if it's an auth endpoint (login/register)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh-token');

    // Handle token refresh - ONLY for non-auth endpoints
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Refreshing token...');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        setToken(accessToken);
        setRefreshToken(newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        console.log('✅ Token refreshed successfully');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        removeToken();
        removeToken('refreshToken');
        
        if (!window.location.pathname.includes('/login')) {
          showNotification('Your session has expired. Please login again.', 'warning');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      const message = error.response?.data?.message || 'Unauthorized. Please login again.';

      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }

      return Promise.reject({
        status: 401,
        message: message,
        data: null
      });
    }

    // Handle forbidden errors (403)
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to perform this action';
      showNotification(message, 'error');
      
      return Promise.reject({
        status: 403,
        message: message,
        data: error.response?.data?.data || null
      });
    }

    // Handle not found errors (404)
    if (error.response?.status === 404) {
      const message = error.response?.data?.message || 'Resource not found';
      showNotification(message, 'warning');
      
      return Promise.reject({
        status: 404,
        message: message,
        data: null
      });
    }

    // Handle conflict errors (409)
    if (error.response?.status === 409) {
      const message = error.response?.data?.message || 'Conflict occurred';
      showNotification(message, 'warning');
      
      return Promise.reject({
        status: 409,
        message: message,
        data: error.response?.data?.data || null
      });
    }

    // Handle server errors (500)
    if (error.response?.status >= 500) {
      const message = error.response?.data?.message || 'Server error. Please try again later.';
      showNotification(message, 'error');
      
      return Promise.reject({
        status: error.response.status,
        message: message,
        data: null
      });
    }

    // Handle network errors
    if (error.request && !error.response) {
      showNotification('Network error - please check your connection', 'error');
      return Promise.reject({
        status: 0,
        message: 'Network error',
        data: null
      });
    }

    // Handle other errors
    const message = error.message || 'An unexpected error occurred';
    if (error.response?.status !== 401) {
      showNotification(message, 'error');
    }

    return Promise.reject({
      status: error.response?.status || -1,
      message: error.response?.data?.message || message,
      data: error.response?.data?.data || null,
      errors: error.response?.data?.errors || null
    });
  }
);

// API Service Methods
const ApiService = {
  // Auth endpoints
  auth: {
    register: (data) => {
      console.log('📝 Registering user:', { ...data, password: '***' });
      return api.post('/auth/register', data);
    },
    login: (data) => {
      console.log('🔑 Logging in user:', { email: data.email });
      return api.post('/auth/login', data);
    },
    logout: () => {
      console.log('🚪 Logging out');
      return api.post('/auth/logout');
    },
    refreshToken: (data) => {
      console.log('🔄 Refreshing token');
      return api.post('/auth/refresh-token', data);
    },
    verifyEmail: (token) => {
      console.log('✅ Verifying email');
      return api.get(`/auth/verify-email/${token}`);
    },
    forgotPassword: (email) => {
      console.log('📧 Requesting password reset for:', email);
      return api.post('/auth/forgot-password', { email });
    },
    resetPassword: (token, data) => {
      console.log('🔐 Resetting password');
      return api.post(`/auth/reset-password/${token}`, data);
    },
    changePassword: (data) => {
      console.log('🔑 Changing password');
      return api.post('/auth/change-password', data);
    },
    getProfile: () => {
      console.log('👤 Getting profile');
      return api.get('/auth/profile');
    },
updateProfile: (data) => {
      console.log('👤 Updating profile');
      return api.put('/auth/profile', data);
    },
    socialLogin: (data) => {
      console.log('🌐 Social login with token');
      return api.post('/auth/social-login', data);
    },
    getAddresses: () => {
      console.log('🏠 Getting addresses');
      return api.get('/users/addresses');
    },
    addAddress: (data) => {
      console.log('🏠 Adding address');
      return api.post('/users/addresses', data);
    },
    updateAddress: (addressId, data) => {
      console.log('🏠 Updating address:', addressId);
      return api.put(`/users/addresses/${addressId}`, data);
    },
    deleteAddress: (addressId) => {
      console.log('🏠 Deleting address:', addressId);
      return api.delete(`/users/addresses/${addressId}`);
    },
    setDefaultAddress: (addressId) => {
      console.log('🏠 Setting default address:', addressId);
      return api.put(`/users/addresses/${addressId}/default`);
    }
  },

  // Product endpoints
  products: {
    getAll: (params) => {
      console.log('📦 Getting products with params:', params);
      return api.get('/products', { params });
    },
    getById: (id) => {
      console.log('📦 Getting product:', id);
      return api.get(`/products/${id}`);
    },
    getBySlug: (slug) => {
      console.log('📦 Getting product by slug:', slug);
      return api.get(`/products/${slug}`);
    },
    search: (query, limit = 10) => {
      console.log('🔍 Searching products:', query);
      return api.get('/products/search', { params: { q: query, limit } });
    },
    getFeatured: (limit = 8) => {
      console.log('⭐ Getting featured products');
      return api.get('/products/featured', { params: { limit } });
    },
    getRelated: (id, limit = 4) => {
      console.log('🔗 Getting related products for:', id);
      return api.get(`/products/${id}/related`, { params: { limit } });
    },
    getReviews: (id, params) => {
      console.log('⭐ Getting reviews for product:', id);
      return api.get(`/products/${id}/reviews`, { params });
    },
    getCategories: () => {
      console.log('📂 Getting categories');
      return api.get('/products/categories');
    },
    create: (data) => {
      console.log('➕ Creating product:', data.name);
      return api.post('/products', data);
    },
    update: (id, data) => {
      console.log('✏️ Updating product:', id);
      return api.put(`/products/${id}`, data);
    },
    delete: (id) => {
      console.log('🗑️ Deleting product:', id);
      return api.delete(`/products/${id}`);
    }
  },

  // Cart endpoints
  cart: {
    get: () => {
      console.log('🛒 Getting cart');
      return api.get('/cart');
    },
    addItem: (data) => {
      console.log('➕ Adding to cart:', data);
      return api.post('/cart/items', data);
    },
    updateItem: (itemId, data) => {
      console.log('✏️ Updating cart item:', itemId);
      return api.put(`/cart/items/${itemId}`, data);
    },
    removeItem: (itemId) => {
      console.log('🗑️ Removing cart item:', itemId);
      return api.delete(`/cart/items/${itemId}`);
    },
    clear: () => {
      console.log('🧹 Clearing cart');
      return api.delete('/cart/clear');
    },
    applyPromo: (data) => {
      console.log('🏷️ Applying promo:', data.code);
      return api.post('/cart/promo', data);
    },
    removePromo: () => {
      console.log('🏷️ Removing promo');
      return api.delete('/cart/promo');
    }
  },

  // Order endpoints
  orders: {
    getAll: (params) => {
      console.log('📋 Getting orders with params:', params);
      return api.get('/orders', { params });
    },
    getById: (id) => {
      console.log('📋 Getting order:', id);
      return api.get(`/orders/${id}`);
    },
    create: (data) => {
      console.log('📋 Creating order');
      return api.post('/orders', data);
    },
    cancel: (id, data) => {
      console.log('❌ Cancelling order:', id);
      return api.post(`/orders/${id}/cancel`, data);
    },
    track: (id) => {
      console.log('📦 Tracking order:', id);
      return api.get(`/orders/${id}/track`);
    },
    getInvoice: (id) => {
      console.log('📄 Getting invoice for order:', id);
      return api.get(`/orders/${id}/invoice`);
    }
  },

  // Wishlist endpoints
  wishlist: {
    get: () => {
      console.log('❤️ Getting wishlist');
      return api.get('/wishlist');
    },
    add: (data) => {
      console.log('❤️ Adding to wishlist:', data.productId);
      return api.post('/wishlist', data);
    },
    remove: (id) => {
      console.log('❤️ Removing from wishlist:', id);
      return api.delete(`/wishlist/${id}`);
    },
    moveToCart: (id, data) => {
      console.log('🔄 Moving wishlist item to cart:', id);
      return api.post(`/wishlist/move-to-cart/${id}`, data);
    }
  },

  // Review endpoints
  reviews: {
    create: (data) => {
      console.log('⭐ Creating review for product:', data.productId);
      return api.post('/reviews', data);
    },
    update: (id, data) => {
      console.log('✏️ Updating review:', id);
      return api.put(`/reviews/${id}`, data);
    },
    delete: (id) => {
      console.log('🗑️ Deleting review:', id);
      return api.delete(`/reviews/${id}`);
    },
    like: (id, data) => {
      console.log('👍 Liking review:', id);
      return api.post(`/reviews/${id}/like`, data);
    }
  },

  // Admin endpoints
  admin: {
    getDashboard: () => {
      console.log('📊 Getting admin dashboard');
      return api.get('/admin/dashboard');
    },
    getProducts: (params) => {
      console.log('📦 Getting admin products with params:', params);
      return api.get('/admin/products', { params });
    },
    importProducts: (data) => {
      console.log('📥 Importing products');
      return api.post('/admin/products/import', data);
    },
    exportProducts: () => {
      console.log('📤 Exporting products');
      return api.get('/admin/products/export');
    },
    getOrders: (params) => {
      console.log('📋 Getting admin orders with params:', params);
      return api.get('/admin/orders', { params });
    },
    updateOrderStatus: (id, data) => {
      console.log('✏️ Updating order status:', id);
      return api.patch(`/admin/orders/${id}/status`, data);
    },
    getInventory: () => {
      console.log('📦 Getting inventory');
      return api.get('/admin/inventory');
    },
    getLowStock: () => {
      console.log('⚠️ Getting low stock products');
      return api.get('/admin/inventory/low-stock');
    },
    getSalesAnalytics: (params) => {
      console.log('📊 Getting sales analytics with params:', params);
      return api.get('/admin/analytics/sales', { params });
    },
    getProductAnalytics: () => {
      console.log('📊 Getting product analytics');
      return api.get('/admin/analytics/products');
    },
    getCustomerAnalytics: () => {
      console.log('📊 Getting customer analytics');
      return api.get('/admin/analytics/customers');
    }
  },

  // Promo endpoints
  promos: {
    validate: (data) => {
      console.log('🏷️ Validating promo:', data.code);
      return api.post('/promos/validate', data);
    },
    getAll: () => {
      console.log('🏷️ Getting all promos');
      return api.get('/promos');
    },
    create: (data) => {
      console.log('➕ Creating promo:', data.code);
      return api.post('/promos', data);
    },
    update: (id, data) => {
      console.log('✏️ Updating promo:', id);
      return api.put(`/promos/${id}`, data);
    },
    delete: (id) => {
      console.log('🗑️ Deleting promo:', id);
      return api.delete(`/promos/${id}`);
    },
    toggle: (id) => {
      console.log('🔄 Toggling promo:', id);
      return api.patch(`/promos/${id}/toggle`);
    }
  },

  // Analytics endpoints
  analytics: {
    getDashboard: () => {
      console.log('📊 Getting analytics dashboard');
      return api.get('/analytics/dashboard');
    },
    getSales: (params) => {
      console.log('📊 Getting sales analytics with params:', params);
      return api.get('/analytics/sales', { params });
    },
    getProducts: (params) => {
      console.log('📊 Getting product analytics with params:', params);
      return api.get('/analytics/products', { params });
    },
    getCustomers: (params) => {
      console.log('📊 Getting customer analytics with params:', params);
      return api.get('/analytics/customers', { params });
    },
    getRevenue: (params) => {
      console.log('📊 Getting revenue analytics with params:', params);
      return api.get('/analytics/revenue', { params });
    },
    getOrders: (params) => {
      console.log('📊 Getting order analytics with params:', params);
      return api.get('/analytics/orders', { params });
    },
    trackEvent: (data) => {
      console.log('📊 Tracking event:', data.event);
      return api.post('/analytics/track', data);
    }
  },

  // Utility methods
  upload: {
    file: (file, onProgress) => {
      console.log('📤 Uploading file:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      });
    },
    multiple: (files, onProgress) => {
      console.log('📤 Uploading multiple files:', files.length);
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return api.post('/uploads/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      });
    },
    avatar: (file, onProgress) => {
      console.log('👤 Uploading avatar:', file.name);
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      });
    }
  },

  // Utility method to check API health
  health: () => {
    console.log('🏥 Checking API health');
    return api.get('/health');
  },

  // Utility method to get API version
  version: () => {
    console.log('📌 Getting API version');
    return api.get('/version');
  }
};

export default ApiService;