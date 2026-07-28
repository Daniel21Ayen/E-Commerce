/**
 * Orders Module - Handles order operations
 */

import ApiService from './api';
import { showNotification, formatCurrency, formatDate } from './utils';
import i18n from './i18n';

class OrderService {
  constructor() {
    this.orders = [];
    this.currentOrder = null;
    this.listeners = [];
    this.loading = false;
    this.pagination = {
      currentPage: 1,
      pages: 1,
      total: 0,
      limit: 10
    };
  }

  /**
   * Initialize order service
   */
  async init() {
    try {
      await this.loadOrders();
    } catch (error) {
      console.error('Failed to initialize orders:', error);
    }
  }

  /**
   * Load orders
   */
  async loadOrders(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.orders.getAll({
        page: params.page || this.pagination.currentPage,
        limit: params.limit || this.pagination.limit,
        ...params
      });
      
      this.orders = response.data.data || [];
      this.pagination = response.data.pagination || this.pagination;
      this.notifyListeners();
      return this.orders;
    } catch (error) {
      console.error('Failed to load orders:', error);
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId) {
    try {
      this.loading = true;
      const response = await ApiService.orders.getById(orderId);
      this.currentOrder = response.data.data;
      return this.currentOrder;
    } catch (error) {
      showNotification(error.message || 'Failed to load order', 'error');
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Create new order
   */
  async createOrder(orderData) {
    try {
      this.loading = true;
      const response = await ApiService.orders.create(orderData);
      const order = response.data.data;
      this.orders.unshift(order);
      this.notifyListeners();
      showNotification('Order placed successfully!', 'success');
      return { success: true, data: order };
    } catch (error) {
      showNotification(error.message || 'Failed to place order', 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, reason = '') {
    try {
      this.loading = true;
      const response = await ApiService.orders.cancel(orderId, { reason });
      const updatedOrder = response.data.data;
      
      // Update order in list
      const index = this.orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        this.orders[index] = updatedOrder;
      }
      
      if (this.currentOrder?.id === orderId) {
        this.currentOrder = updatedOrder;
      }
      
      this.notifyListeners();
      showNotification('Order cancelled successfully', 'success');
      return { success: true, data: updatedOrder };
    } catch (error) {
      showNotification(error.message || 'Failed to cancel order', 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Track order
   */
  async trackOrder(orderId) {
    try {
      const response = await ApiService.orders.track(orderId);
      return response.data.data;
    } catch (error) {
      showNotification(error.message || 'Failed to track order', 'error');
      return null;
    }
  }

  /**
   * Get order invoice
   */
  async getInvoice(orderId) {
    try {
      const response = await ApiService.orders.getInvoice(orderId);
      return response.data;
    } catch (error) {
      showNotification(error.message || 'Failed to get invoice', 'error');
      return null;
    }
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status) {
    return this.orders.filter(order => order.status === status);
  }

  /**
   * Get order count by status
   */
  getOrderCountByStatus(status) {
    return this.getOrdersByStatus(status).length;
  }

  /**
   * Get total spent
   */
  getTotalSpent() {
    return this.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  }

  /**
   * Get recent orders
   */
  getRecentOrders(count = 5) {
    return this.orders.slice(0, count);
  }

  /**
   * Format order status
   */
  formatStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded',
      'on_hold': 'On Hold'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color class
   */
  getStatusColor(status) {
    const colorMap = {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'info',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'danger',
      'refunded': 'secondary',
      'on_hold': 'warning'
    };
    return colorMap[status] || 'secondary';
  }

  /**
   * Format order for display
   */
  formatOrder(order) {
    return {
      ...order,
      formattedDate: formatDate(order.createdAt),
      formattedTotal: formatCurrency(order.totalAmount),
      formattedSubtotal: formatCurrency(order.subtotal || order.totalAmount),
      formattedDiscount: formatCurrency(order.discountAmount || 0),
      formattedShipping: formatCurrency(order.shippingCost || 0),
      formattedTax: formatCurrency(order.taxAmount || 0),
      statusText: this.formatStatus(order.status),
      statusColor: this.getStatusColor(order.status),
      itemCount: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    };
  }

  /**
   * Format orders for display
   */
  formatOrders(orders) {
    return orders.map(order => this.formatOrder(order));
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
        callback(this.orders);
      } catch (error) {
        console.error('Error in order listener:', error);
      }
    });
  }

  /**
   * Get pagination info
   */
  getPagination() {
    return this.pagination;
  }

  /**
   * Go to page
   */
  async goToPage(page) {
    if (page < 1 || page > this.pagination.pages) return;
    return this.loadOrders({ page });
  }

  /**
   * Reset state
   */
  reset() {
    this.orders = [];
    this.currentOrder = null;
    this.pagination = {
      currentPage: 1,
      pages: 1,
      total: 0,
      limit: 10
    };
    this.notifyListeners();
  }
}

// Create singleton instance
const orderService = new OrderService();

export default orderService;

