/**
 * Admin Module
 * Comprehensive administration service handling metrics, catalog management,
 * order processing, inventory tracking, batch operations, and analytics.
 */

import ApiService from './api';
import { showNotification, formatDate } from './utils';

class AdminService {
  constructor() {
    this.stats = null;
    this.products = [];
    this.pagination = null;
    this.orders = [];
    this.orderPagination = null;
    this.inventory = [];
    this.inventoryPagination = null;
    this.analytics = null;
    this.loading = false;
    this.listeners = [];
  }

  // ==========================================
  // DASHBOARD & OVERVIEW
  // ==========================================

  /**
   * Load top-level dashboard metrics and summaries
   */
  async loadDashboard() {
    try {
      this.loading = true;
      const response = await ApiService.admin.getDashboard();
      this.stats = response.data?.data || response.data || null;
      this.notifyListeners();
      return this.stats;
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to load dashboard metrics',
        'error'
      );
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get cached dashboard statistics
   */
  getStats() {
    return this.stats;
  }

  // ==========================================
  // PRODUCT MANAGEMENT (CRUD & BATCH)
  // ==========================================

  /**
   * Load paginated product list with optional filtering/sorting params
   */
  async loadProducts(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getProducts(params);
      this.products = response.data?.data || response.data || [];
      this.pagination = response.data?.pagination || null;
      this.notifyListeners();
      return this.products;
    } catch (error) {
      console.error('Failed to load products:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to load products',
        'error'
      );
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get cached products
   */
  getProducts() {
    return this.products;
  }

  /**
   * Create a new product entry
   */
  async createProduct(productData) {
    try {
      this.loading = true;
      const response = await ApiService.admin.createProduct(productData);
      const createdProduct = response.data?.data || response.data;
      
      this.products = [createdProduct, ...this.products];
      this.notifyListeners();
      
      showNotification('Product created successfully', 'success');
      return { success: true, data: createdProduct };
    } catch (error) {
      console.error('Failed to create product:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create product';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Update an existing product by ID
   */
  async updateProduct(productId, productData) {
    try {
      this.loading = true;
      const response = await ApiService.admin.updateProduct(productId, productData);
      const updatedProduct = response.data?.data || response.data;

      const index = this.products.findIndex(p => p.id === productId || p._id === productId);
      if (index !== -1) {
        this.products[index] = { ...this.products[index], ...updatedProduct };
        this.notifyListeners();
      }

      showNotification('Product updated successfully', 'success');
      return { success: true, data: updatedProduct };
    } catch (error) {
      console.error('Failed to update product:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update product';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Delete a single product by ID
   */
  async deleteProduct(productId) {
    try {
      this.loading = true;
      await ApiService.admin.deleteProduct(productId);
      
      this.products = this.products.filter(p => p.id !== productId && p._id !== productId);
      this.notifyListeners();
      
      showNotification('Product deleted successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete product:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete product';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Delete multiple products in batch
   */
  async bulkDeleteProducts(productIds = []) {
    try {
      this.loading = true;
      await ApiService.admin.bulkDeleteProducts({ ids: productIds });

      this.products = this.products.filter(
        p => !productIds.includes(p.id) && !productIds.includes(p._id)
      );
      this.notifyListeners();

      showNotification(`${productIds.length} products deleted successfully`, 'success');
      return { success: true };
    } catch (error) {
      console.error('Failed bulk product deletion:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete selected products';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Import product catalog via CSV / FormData
   */
  async importProducts(file, onProgress) {
    try {
      this.loading = true;
      const formData = new FormData();
      formData.append('file', file);

      const response = await ApiService.admin.importProducts(formData, {
        onUploadProgress: onProgress
      });

      showNotification('Products imported successfully', 'success');
      await this.loadProducts();
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      console.error('Product import failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to import products';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Export product catalog as CSV file download
   */
  async exportProducts() {
    try {
      this.loading = true;
      const response = await ApiService.admin.exportProducts();

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_export_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification('Products exported successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Product export failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export products';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  // ==========================================
  // ORDER MANAGEMENT
  // ==========================================

  /**
   * Load orders list with parameters
   */
  async loadOrders(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getOrders(params);
      this.orders = response.data?.data || response.data || [];
      this.orderPagination = response.data?.pagination || null;
      this.notifyListeners();
      return this.orders;
    } catch (error) {
      console.error('Failed to load orders:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to load orders',
        'error'
      );
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get cached order list
   */
  getOrders() {
    return this.orders;
  }

  /**
   * Fetch single order details by ID
   */
  async getOrderDetails(orderId) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getOrderDetails(orderId);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to fetch order details',
        'error'
      );
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Update status and tracking info for a specific order
   */
  async updateOrderStatus(orderId, status, trackingData = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.updateOrderStatus(orderId, {
        status,
        ...trackingData
      });

      const updatedData = response.data?.data || response.data;
      const index = this.orders.findIndex(o => o.id === orderId || o._id === orderId);

      if (index !== -1) {
        this.orders[index] = { ...this.orders[index], ...updatedData };
        this.notifyListeners();
      }

      showNotification('Order status updated successfully', 'success');
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Failed to update order status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update order status';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Update order status across multiple orders in bulk
   */
  async bulkUpdateOrderStatus(orderIds = [], status) {
    try {
      this.loading = true;
      await ApiService.admin.bulkUpdateOrderStatus({ ids: orderIds, status });

      this.orders = this.orders.map(order => {
        if (orderIds.includes(order.id) || orderIds.includes(order._id)) {
          return { ...order, status };
        }
        return order;
      });
      this.notifyListeners();

      showNotification('Selected orders updated successfully', 'success');
      return { success: true };
    } catch (error) {
      console.error('Bulk order status update failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update order statuses';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  // ==========================================
  // INVENTORY MANAGEMENT
  // ==========================================

  /**
   * Load system inventory levels
   */
  async loadInventory(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getInventory(params);
      this.inventory = response.data?.data || response.data || [];
      this.inventoryPagination = response.data?.pagination || null;
      this.notifyListeners();
      return this.inventory;
    } catch (error) {
      console.error('Failed to load inventory:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to load inventory',
        'error'
      );
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get cached inventory state
   */
  getInventory() {
    return this.inventory;
  }

  /**
   * Retrieve low stock alerts and products
   */
  async getLowStock() {
    try {
      const response = await ApiService.admin.getLowStock();
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to retrieve low stock list:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to retrieve low stock alerts',
        'error'
      );
      return [];
    }
  }

  /**
   * Update stock quantities for a specific product item/variant
   */
  async updateStock(productId, stockData) {
    try {
      this.loading = true;
      const response = await ApiService.admin.updateStock(productId, stockData);
      const updatedItem = response.data?.data || response.data;

      const index = this.inventory.findIndex(item => item.productId === productId || item.id === productId);
      if (index !== -1) {
        this.inventory[index] = { ...this.inventory[index], ...updatedItem };
        this.notifyListeners();
      }

      showNotification('Inventory updated successfully', 'success');
      return { success: true, data: updatedItem };
    } catch (error) {
      console.error('Failed to update inventory stock:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update stock';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      this.loading = false;
    }
  }

  // ==========================================
  // ANALYTICS & REPORTING
  // ==========================================

  /**
   * Load sales metrics & historical trends
   */
  async loadSalesAnalytics(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getSalesAnalytics(params);
      this.analytics = {
        ...this.analytics,
        sales: response.data?.data || response.data
      };
      this.notifyListeners();
      return this.analytics.sales;
    } catch (error) {
      console.error('Failed to load sales analytics:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to load sales analytics',
        'error'
      );
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load product performance analytics
   */
  async loadProductAnalytics(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getProductAnalytics(params);
      this.analytics = {
        ...this.analytics,
        products: response.data?.data || response.data
      };
      this.notifyListeners();
      return this.analytics.products;
    } catch (error) {
      console.error('Failed to load product performance analytics:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to load product analytics',
        'error'
      );
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load customer demographics & acquisition analytics
   */
  async loadCustomerAnalytics(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.admin.getCustomerAnalytics(params);
      this.analytics = {
        ...this.analytics,
        customers: response.data?.data || response.data
      };
      this.notifyListeners();
      return this.analytics.customers;
    } catch (error) {
      console.error('Failed to load customer analytics:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to load customer analytics',
        'error'
      );
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get cached analytics state
   */
  getAnalytics() {
    return this.analytics;
  }

  // ==========================================
  // EVENT LISTENERS & STATE SUBSCRIPTIONS
  // ==========================================

  /**
   * Register a callback listener for module state changes
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Remove a registered callback listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Trigger state notifications across registered subscribers
   */
  notifyListeners() {
    const currentState = {
      stats: this.stats,
      products: this.products,
      pagination: this.pagination,
      orders: this.orders,
      orderPagination: this.orderPagination,
      inventory: this.inventory,
      inventoryPagination: this.inventoryPagination,
      analytics: this.analytics,
      loading: this.loading
    };

    this.listeners.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('Error executing admin state listener:', error);
      }
    });
  }

  /**
   * Reset local module state to initial values
   */
  resetState() {
    this.stats = null;
    this.products = [];
    this.pagination = null;
    this.orders = [];
    this.orderPagination = null;
    this.inventory = [];
    this.inventoryPagination = null;
    this.analytics = null;
    this.loading = false;
    this.notifyListeners();
  }
}

// Instantiate and export single admin service instance
const adminService = new AdminService();

export default adminService;