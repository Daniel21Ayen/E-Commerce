/**
 * Cart Module - Handles shopping cart operations
 */

import ApiService from './api';
import { showNotification, formatCurrency, updateCartBadge } from './utils';

class CartService { 
  constructor() {
    this.cart = null;
    this.listeners = [];
    this.loading = false;
  }

  /**
   * Initialize cart
   */
  async init() {
    try {
      this.loading = true;
      const response = await ApiService.cart.get();
      this.cart = response.data.data;
      this.updateBadge();
      this.notifyListeners();
      return this.cart;
    } catch (error) {
      console.error('Failed to load cart:', error);
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get cart data
   */
  getCart() {
    return this.cart;
  }

  /**
   * Get cart items
   */
  getItems() {
    return this.cart?.items || [];
  }

  /**
   * Get cart totals
   */
  getTotals() {
    if (!this.cart) return { items: 0, subtotal: 0, discount: 0, total: 0 };
    
    const items = this.cart.items || [];
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = this.cart.discountAmount || 0;
    const total = this.cart.finalPrice || subtotal - discount;

    return {
      items: totalItems,
      subtotal,
      discount,
      total,
      formattedSubtotal: formatCurrency(subtotal),
      formattedDiscount: formatCurrency(discount),
      formattedTotal: formatCurrency(total)
    };
  }

  /**
   * Add item to cart
   */

async addItem(productId, quantity = 1, variantId = null) {
  try {
    this.loading = true;
    const response = await ApiService.cart.addItem({ 
      productId, 
      quantity: parseInt(quantity), 
      variantId 
    });
    this.cart = response.data.data;
    this.updateBadge();
    this.notifyListeners();
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Add to cart error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to add to cart' 
    };
  } finally {
    this.loading = false;
  }
}

  /**
   * Update cart item quantity
   */
  async updateItem(itemId, quantity) {
    try {
      this.loading = true;
      const response = await ApiService.cart.updateItem(itemId, { quantity });
      this.cart = response.data.data;
      this.updateBadge();
      this.notifyListeners();
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('cart.updateError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId) {
    try {
      this.loading = true;
      await ApiService.cart.removeItem(itemId);
      this.cart.items = this.cart.items.filter(item => item.id !== itemId);
      await this.updateTotals();
      this.updateBadge();
      this.notifyListeners();
      showNotification(i18n.t('cart.itemRemoved'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('cart.removeError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Clear cart
   */
  async clear() {
    try {
      this.loading = true;
      await ApiService.cart.clear();
      this.cart.items = [];
      await this.updateTotals();
      this.updateBadge();
      this.notifyListeners();
      showNotification(i18n.t('cart.cleared'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('cart.clearError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Apply promo code
   */
  async applyPromo(code) {
    try {
      this.loading = true;
      const response = await ApiService.cart.applyPromo({ code });
      this.cart = response.data.data;
      this.updateBadge();
      this.notifyListeners();
      showNotification(i18n.t('cart.promoApplied'), 'success');
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('cart.promoError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Remove promo code
   */
  async removePromo() {
    try {
      this.loading = true;
      const response = await ApiService.cart.removePromo();
      this.cart = response.data.data;
      this.updateBadge();
      this.notifyListeners();
      showNotification(i18n.t('cart.promoRemoved'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('cart.promoRemoveError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Update cart totals
   */
  async updateTotals() {
    try {
      const totals = this.getTotals();
      if (this.cart) {
        this.cart.totalItems = totals.items;
        this.cart.totalPrice = totals.subtotal;
        this.cart.finalPrice = totals.total;
        this.cart.discountAmount = totals.discount;
      }
      return totals;
    } catch (error) {
      console.error('Failed to update totals:', error);
      return null;
    }
  }

  /**
   * Update cart badge
   */
  updateBadge() {
    const totals = this.getTotals();
    updateCartBadge(totals.items);
  }

  /**
   * Add listener for cart changes
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
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.cart);
      } catch (error) {
        console.error('Error in cart listener:', error);
      }
    });
  }

  /**
   * Get cart item count
   */
  getItemCount() {
    return this.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  /**
   * Check if item is in cart
   */
  isInCart(productId, variantId = null) {
    if (!this.cart?.items) return false;
    return this.cart.items.some(item => 
      item.productId === productId && 
      (variantId ? item.variantId === variantId : !item.variantId)
    );
  }

  /**
   * Get cart item by product
   */
  getCartItem(productId, variantId = null) {
    if (!this.cart?.items) return null;
    return this.cart.items.find(item => 
      item.productId === productId && 
      (variantId ? item.variantId === variantId : !item.variantId)
    );
  }

  /**
   * Format cart for checkout
   */
  getCheckoutData() {
    if (!this.cart) return null;
    
    return {
      items: this.cart.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: this.cart.totalPrice,
      discount: this.cart.discountAmount || 0,
      total: this.cart.finalPrice || this.cart.totalPrice,
      promoCode: this.cart.promoCodeId
    };
  }

  /**
   * Reset cart state
   */
  reset() {
    this.cart = null;
    this.updateBadge();
    this.notifyListeners();
  }
}

// Create singleton instance
const cartService = new CartService();

export default cartService;