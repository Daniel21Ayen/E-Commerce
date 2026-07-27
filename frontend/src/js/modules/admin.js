/**
 * Admin Module - Handles admin dashboard and management
 */

import ApiService from './api';
import { showNotification, formatCurrency, formatDate } from './utils';
import i18n from './i18n';

class AdminService {
  constructor() {
    this.stats = null;
    this.products = [];
    this.orders = [];
    this.inventory = [];
    this.analytics = null;
    this.loading = false;
    this.listeners = [];
  }

  /**
   * Load dashboard stats
   */
  async loadDashboard() {
    try {
      this.loading = true;
      const response = await ApiService.admin.getDashboard();
      this.stats = response.data.data;
      this.notifyListeners();
      return this.stats;
    } catch (error) {
      showNotification(error.message || i18n.t('admin.loadError'), 'error');
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get dashboard stats
   */
  getStats() {
    return this.stats;
  }

  /**
   * Load all products (admin)
   */
  async loadProducts(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getProducts(params);
      this.products = response.data.data || [];
      this.pagination = response.data.pagination || null;
      this.notifyListeners();
      return this.products;
    } catch (error) {
      showNotification(error.message || i18n.t('admin.productsLoadError'), 'error');
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get products
   */
  getProducts() {
    return this.products;
  }

  /**
   * Load all orders (admin)
   */
  async loadOrders(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getOrders(params);
      this.orders = response.data.data || [];
      this.orderPagination = response.data.pagination || null;
      this.notifyListeners();
      return this.orders;
    } catch (error) {
      showNotification(error.message || i18n.t('admin.ordersLoadError'), 'error');
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get orders
   */
  getOrders() {
    return this.orders;
  }

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(orderId, status, trackingData = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.updateOrderStatus(orderId, {
        status,
        ...trackingData
      });
      
      // Update in list
      const index = this.orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        this.orders[index] = { ...this.orders[index], ...response.data.data };
        this.notifyListeners();
      }
      
      showNotification(i18n.t('admin.orderStatusUpdated'), 'success');
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('admin.orderStatusError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load inventory
   */
  async loadInventory() {
    try {
      this.loading = true;
      const response = await ApiService.admin.getInventory();
      this.inventory = response.data.data || [];
      this.notifyListeners();
      return this.inventory;
    } catch (error) {
      showNotification(error.message || i18n.t('admin.inventoryLoadError'), 'error');
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get inventory
   */
  getInventory() {
    return this.inventory;
  }

  /**
   * Get low stock products
   */
  async getLowStock() {
    try {
      const response = await ApiService.admin.getLowStock();
      return response.data.data || [];
    } catch (error) {
      showNotification(error.message || i18n.t('admin.lowStockError'), 'error');
      return [];
    }
  }

  /**
   * Import products from CSV
   */
  async importProducts(file, onProgress) {
    try {
      this.loading = true;
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await ApiService.admin.importProducts(formData, {
        onUploadProgress: onProgress
      });
      
      showNotification(i18n.t('admin.importSuccess'), 'success');
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('admin.importError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Export products to CSV
   */
  async exportProducts() {
    try {
      this.loading = true;
      const response = await ApiService.admin.exportProducts();
      
      // Download file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification(i18n.t('admin.exportSuccess'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('admin.exportError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load sales analytics
   */
  async loadSalesAnalytics(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getSalesAnalytics(params);
      this.analytics = {
        ...this.analytics,
        sales: response.data.data
      };
      this.notifyListeners();
      return this.analytics.sales;
    } catch (error) {
      showNotification(error.message || i18n.t('admin.analyticsError'), 'error');
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load product analytics
   */
  async loadProductAnalytics() {
    try {
      this.loading = true;
      const response = await ApiService.admin.getProductAnalytics();
      this.analytics = {
        ...this.analytics,
        products: response.data.data
      };
      this.notifyListeners();
      return this.analytics.products;
    } catch (error) {
      showNotification(error.message || i18n.t('admin.analyticsError'), 'error');
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load customer analytics
   */
  async loadCustomerAnalytics() {
    try {
      this.loading = true;
      const response = await ApiService.admin.getCustomerAnalytics();
      this.analytics = {
        ...this.analytics,
        customers: response.data.data
      };
      this.notifyListeners();
      return this.analytics.customers;
    } catch (error) {
      showNotification(error.message || i18n.t('admin.analyticsError'), 'error');
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    return this.analytics;
  }

  /**
   * Add listener
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          stats: this.stats,
          products: this.products,
          orders: this.orders,
          inventory: this.inventory,
          analytics: this.analytics
        });
      } catch (error) {
        console.error('Error in admin listener:', error);
      }
    });
  }
}

// Create singleton instance
const adminService = new AdminService();

export default adminService;