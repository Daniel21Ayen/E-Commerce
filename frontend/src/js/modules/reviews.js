/**
 * Reviews Module - Handles product reviews
 */

import ApiService from './api';
import { showNotification, formatDate } from './utils';
import i18n from './i18n';

class ReviewService {
  constructor() {
    this.reviews = [];
    this.loading = false;
    this.listeners = [];
  }

  /**
   * Load product reviews
   */
  async loadReviews(productId, params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.products.getReviews(productId, params);
      this.reviews = response.data.data || [];
      this.pagination = response.data.pagination || null;
      this.notifyListeners();
      return this.reviews;
    } catch (error) {
      console.error('Failed to load reviews:', error);
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get reviews
   */
  getReviews() {
    return this.reviews;
  }

  /**
   * Get pagination
   */
  getPagination() {
    return this.pagination;
  }

  /**
   * Create review
   */
  async createReview(data) {
    try {
      this.loading = true;
      const response = await ApiService.reviews.create(data);
      const newReview = response.data.data;
      
      // Add to list if same product
      if (newReview.productId === this.currentProductId) {
        this.reviews.unshift(newReview);
        this.notifyListeners();
      }
      
      showNotification(i18n.t('reviews.created'), 'success');
      return { success: true, data: newReview };
    } catch (error) {
      showNotification(error.message || i18n.t('reviews.createError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Update review
   */
  async updateReview(id, data) {
    try {
      this.loading = true;
      const response = await ApiService.reviews.update(id, data);
      const updatedReview = response.data.data;
      
      // Update in list
      const index = this.reviews.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reviews[index] = updatedReview;
        this.notifyListeners();
      }
      
      showNotification(i18n.t('reviews.updated'), 'success');
      return { success: true, data: updatedReview };
    } catch (error) {
      showNotification(error.message || i18n.t('reviews.updateError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Delete review
   */
  async deleteReview(id) {
    try {
      this.loading = true;
      await ApiService.reviews.delete(id);
      
      // Remove from list
      this.reviews = this.reviews.filter(r => r.id !== id);
      this.notifyListeners();
      
      showNotification(i18n.t('reviews.deleted'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('reviews.deleteError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Like review
   */
  async likeReview(id) {
    try {
      this.loading = true;
      const response = await ApiService.reviews.like(id, { isLike: true });
      
      // Update in list
      const index = this.reviews.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reviews[index] = { ...this.reviews[index], ...response.data.data };
        this.notifyListeners();
      }
      
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('reviews.likeError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Unlike review
   */
  async unlikeReview(id) {
    try {
      this.loading = true;
      const response = await ApiService.reviews.like(id, { isLike: false });
      
      // Update in list
      const index = this.reviews.findIndex(r => r.id === id);
      if (index !== -1) {
        this.reviews[index] = { ...this.reviews[index], ...response.data.data };
        this.notifyListeners();
      }
      
      return { success: true, data: response.data.data };
    } catch (error) {
      showNotification(error.message || i18n.t('reviews.unlikeError'), 'error');
      return { success: false, error: error.message };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Toggle like
   */
  async toggleLike(id) {
    const review = this.reviews.find(r => r.id === id);
    if (!review) return { success: false, error: 'Review not found' };
    
    // Check if user already liked
    const hasLiked = review._count?.likes > 0;
    return hasLiked ? this.unlikeReview(id) : this.likeReview(id);
  }

  /**
   * Get review by ID
   */
  getReview(id) {
    return this.reviews.find(r => r.id === id);
  }

  /**
   * Get review count
   */
  getCount() {
    return this.reviews.length;
  }

  /**
   * Get average rating
   */
  getAverageRating() {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((total, r) => total + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  /**
   * Get rating distribution
   */
  getRatingDistribution() {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.reviews.forEach(r => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });
    return distribution;
  }

  /**
   * Get reviews by rating
   */
  getReviewsByRating(rating) {
    return this.reviews.filter(r => r.rating === rating);
  }

  /**
   * Format review date
   */
  formatDate(date) {
    return formatDate(date);
  }

  /**
   * Check if user can review product
   */
  async canReview(productId) {
    try {
      const response = await ApiService.products.canReview(productId);
      return response.data.data.canReview;
    } catch {
      return false;
    }
  }

  /**
   * Add listener for review changes
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
        callback(this.reviews);
      } catch (error) {
        console.error('Error in review listener:', error);
      }
    });
  }
}

// Create singleton instance
const reviewService = new ReviewService();

export default reviewService;