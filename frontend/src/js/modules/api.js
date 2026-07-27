/**
 * API Module - Handles all HTTP requests to the backend
 * Uses axios for HTTP requests with interceptors for authentication
 */

import axios from 'axios';
import { getToken, setToken, removeToken, getRefreshToken, setRefreshToken } from './auth';
import { showNotification } from './utils';

// API Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
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
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        setToken(accessToken);
        setRefreshToken(newRefreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        removeToken();
        removeToken('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Show error notification for non-401 errors
      if (status !== 401) {
        const message = data?.message || 'An error occurred';
        showNotification(message, 'error');
      }

      return Promise.reject({
        status,
        message: data?.message || 'Request failed',
        data: data?.data || null,
        errors: data?.errors || null
      });
    } else if (error.request) {
      // Request made but no response
      showNotification('Network error - please check your connection', 'error');
      return Promise.reject({
        status: 0,
        message: 'Network error',
        data: null
      });
    } else {
      // Something else happened
      return Promise.reject({
        status: -1,
        message: error.message || 'Unknown error',
        data: null
      });
    }
  }
);

// API Service Methods
const ApiService = {
  // Auth endpoints
  auth: {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    refreshToken: (data) => api.post('/auth/refresh-token', data),
    verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
    changePassword: (data) => api.post('/auth/change-password', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data)
  },

  // Product endpoints
  products: {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    getBySlug: (slug) => api.get(`/products/${slug}`),
    search: (query, limit = 10) => api.get('/products/search', { params: { q: query, limit } }),
    getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
    getRelated: (id, limit = 4) => api.get(`/products/${id}/related`, { params: { limit } }),
    getReviews: (id, params) => api.get(`/products/${id}/reviews`, { params }),
    getCategories: () => api.get('/products/categories'),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
  },

  // Cart endpoints
  cart: {
    get: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
    removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
    clear: () => api.delete('/cart/clear'),
    applyPromo: (data) => api.post('/cart/promo', data),
    removePromo: () => api.delete('/cart/promo')
  },

  // Order endpoints
  orders: {
    getAll: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
    track: (id) => api.get(`/orders/${id}/track`),
    getInvoice: (id) => api.get(`/orders/${id}/invoice`)
  },

  // Wishlist endpoints
  wishlist: {
    get: () => api.get('/wishlist'),
    add: (data) => api.post('/wishlist', data),
    remove: (id) => api.delete(`/wishlist/${id}`),
    moveToCart: (id, data) => api.post(`/wishlist/move-to-cart/${id}`, data)
  },

  // Review endpoints
  reviews: {
    create: (data) => api.post('/reviews', data),
    update: (id, data) => api.put(`/reviews/${id}`, data),
    delete: (id) => api.delete(`/reviews/${id}`),
    like: (id, data) => api.post(`/reviews/${id}/like`, data)
  },

  // Admin endpoints
  admin: {
    getDashboard: () => api.get('/admin/dashboard'),
    getProducts: (params) => api.get('/admin/products', { params }),
    importProducts: (data) => api.post('/admin/products/import', data),
    exportProducts: () => api.get('/admin/products/export'),
    getOrders: (params) => api.get('/admin/orders', { params }),
    updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
    getInventory: () => api.get('/admin/inventory'),
    getLowStock: () => api.get('/admin/inventory/low-stock'),
    getSalesAnalytics: (params) => api.get('/admin/analytics/sales', { params }),
    getProductAnalytics: () => api.get('/admin/analytics/products'),
    getCustomerAnalytics: () => api.get('/admin/analytics/customers')
  },

  // Promo endpoints
  promos: {
    validate: (data) => api.post('/promos/validate', data),
    getAll: () => api.get('/promos'),
    create: (data) => api.post('/promos', data),
    update: (id, data) => api.put(`/promos/${id}`, data),
    delete: (id) => api.delete(`/promos/${id}`),
    toggle: (id) => api.patch(`/promos/${id}/toggle`)
  },

  // Analytics endpoints
  analytics: {
    getDashboard: () => api.get('/analytics/dashboard'),
    getSales: (params) => api.get('/analytics/sales', { params }),
    getProducts: (params) => api.get('/analytics/products', { params }),
    getCustomers: (params) => api.get('/analytics/customers', { params }),
    getRevenue: (params) => api.get('/analytics/revenue', { params }),
    getOrders: (params) => api.get('/analytics/orders', { params }),
    trackEvent: (data) => api.post('/analytics/track', data)
  },

  // Utility methods
  upload: {
    file: (file, onProgress) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      });
    },
    multiple: (files, onProgress) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return api.post('/uploads/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      });
    }
  }
};

export default ApiService;