/**
 * Wishlist Module - Handles wishlist operations
 */

import ApiService from './api';
import { showNotification } from './utils';
import cartService from './cart';

class WishlistService {
  constructor() {
    this.items = [];
    this.loading = false;
    this.listeners = [];
  }

  /**
   * Initialize wishlist
   */
  async init() {
    await this.loadWishlist();
  }

  /**
   * Load wishlist
   */
  async loadWishlist() {
    try {
      this.loading = true;
      const response = await ApiService.wishlist.get();
      this.items = response.data.data || [];
      this.notifyListeners();
      return this.items;
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get wishlist items
   */
  getItems() {
    return this.items;
  }

  /**
   * Get wishlist count
   */
  getCount() {
    return this.items.length;
  }

  /**
   * Add item to wishlist
   */
  async addItem(productId, variantId = null, notes = '') {
    try {
      this.loading = true;
      const response = await ApiService.wishlist.add({ productId, variantId, notes });
      this.items = response.data.data || [];
      this.notifyListeners();
      showNotification(i18n.t('wishlist.added'), 'success');
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('wishlist.addError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Remove item from wishlist
   */
  async removeItem(id) {
    try {
      this.loading = true;
      await ApiService.wishlist.remove(id);
      this.items = this.items.filter(item => item.id !== id);
      this.notifyListeners();
      showNotification(i18n.t('wishlist.removed'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('wishlist.removeError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Remove item by product ID
   */
  async removeByProductId(productId, variantId = null) {
    const item = this.items.find(
      item => item.productId === productId && 
      (variantId ? item.variantId === variantId : !item.variantId)
    );
    if (item) {
      return this.removeItem(item.id);
    }
    return { success: false, error: 'Item not found' };
  }

  /**
   * Move item to cart
   */
  async moveToCart(id, quantity = 1) {
    try {
      this.loading = true;
      const response = await ApiService.wishlist.moveToCart(id, { quantity });
      
      // Remove from wishlist
      this.items = this.items.filter(item => item.id !== id);
      this.notifyListeners();
      
      // Refresh cart
      await cartService.init();
      
      showNotification(i18n.t('wishlist.movedToCart'), 'success');
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('wishlist.moveError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Move all items to cart
   */
  async moveAllToCart() {
    try {
      this.loading = true;
      let successCount = 0;
      let errorCount = 0;

      for (const item of this.items) {
        const result = await this.moveToCart(item.id, 1);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showNotification(
          i18n.t('wishlist.movedAll', { count: successCount }),
          'success'
        );
      }
      if (errorCount > 0) {
        showNotification(
          i18n.t('wishlist.moveAllError', { count: errorCount }),
          'error'
        );
      }

      return { success: true, successCount, errorCount };
    } catch (error) {
      showNotification(error.message || i18n.t('wishlist.moveAllError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Check if product is in wishlist
   */
  isInWishlist(productId, variantId = null) {
    return this.items.some(
      item => item.productId === productId && 
      (variantId ? item.variantId === variantId : !item.variantId)
    );
  }

  /**
   * Get wishlist item by product
   */
  getWishlistItem(productId, variantId = null) {
    return this.items.find(
      item => item.productId === productId && 
      (variantId ? item.variantId === variantId : !item.variantId)
    );
  }

  /**
   * Toggle wishlist item
   */
  async toggleItem(productId, variantId = null, notes = '') {
    if (this.isInWishlist(productId, variantId)) {
      return this.removeByProductId(productId, variantId);
    } else {
      return this.addItem(productId, variantId, notes);
    }
  }

  /**
   * Clear wishlist
   */
  async clear() {
    try {
      this.loading = true;
      const items = [...this.items];
      let successCount = 0;

      for (const item of items) {
        const result = await this.removeItem(item.id);
        if (result.success) successCount++;
      }

      showNotification(i18n.t('wishlist.cleared'), 'success');
      return { success: true, count: successCount };
    } catch (error) {
      showNotification(error.message || i18n.t('wishlist.clearError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Add listener for wishlist changes
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
        callback(this.items);
      } catch (error) {
        console.error('Error in wishlist listener:', error);
      }
    });
  }
}

// Create singleton instance
const wishlistService = new WishlistService();

export default wishlistService;