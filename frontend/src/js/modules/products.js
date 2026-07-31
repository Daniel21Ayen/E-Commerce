/**
 * Products Module - Handles product listing, filtering, and display
 */

import ApiService from './api';
import { showNotification, formatCurrency, debounce } from './utils';

class ProductService {
  constructor() {
    this.products = [];
    this.categories = [];
    this.filters = {
      category: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      inStock: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: '',
      page: 1,
      limit: 20
    };
    this.pagination = {
      total: 0,
      pages: 0,
      currentPage: 1
    };
    this.loading = false;
    this.listeners = [];
  }

  /**
   * Initialize products
   */
  async init() {
    await this.loadCategories();
    await this.loadProducts();
  }

  /**
   * Load products with filters
   */
  async loadProducts(params = {}) {
    try {
      this.loading = true;
      const filters = { ...this.filters, ...params };
      
      const response = await ApiService.products.getAll(filters);
      this.products = response.data.data;
      this.pagination = response.data.pagination;
      this.filters.page = filters.page || 1;
      
      this.notifyListeners();
      return { products: this.products, pagination: this.pagination };
    } catch (error) {
      showNotification(error.message || i18n.t('products.loadError'), 'error');
      return { products: [], pagination: null };
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load product by ID
   */
  async getProduct(id) {
    try {
      this.loading = true;
      const response = await ApiService.products.getById(id);
      return response.data.data;
    } catch (error) {
      showNotification(error.message || i18n.t('products.loadError'), 'error');
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load product by slug
   */
  async getProductBySlug(slug) {
    try {
      this.loading = true;
      const response = await ApiService.products.getBySlug(slug);
      return response.data.data;
    } catch (error) {
      showNotification(error.message || i18n.t('products.loadError'), 'error');
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load categories
   */
  async loadCategories() {
    try {
      const response = await ApiService.products.getCategories();
      this.categories = response.data.data;
      return this.categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  }

  /**
   * Search products
   */
  async search(query, limit = 10) {
    try {
      if (!query || query.length < 2) {
        return [];
      }
      
      const response = await ApiService.products.search(query, limit);
      return response.data.data;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get featured products
   */
  async getFeatured(limit = 8) {
    try {
      const response = await ApiService.products.getFeatured(limit);
      return response.data.data;
    } catch (error) {
      console.error('Failed to load featured products:', error);
      return [];
    }
  }

  /**
   * Get related products
   */
  async getRelated(productId, limit = 4) {
    try {
      const response = await ApiService.products.getRelated(productId, limit);
      return response.data.data;
    } catch (error) {
      console.error('Failed to load related products:', error);
      return [];
    }
  }

  /**
   * Get product reviews
   */
  async getReviews(productId, params = {}) {
    try {
      const response = await ApiService.products.getReviews(productId, params);
      return response.data;
    } catch (error) {
      console.error('Failed to load reviews:', error);
      return { data: [], pagination: null };
    }
  }

  /**
   * Set filter
   */
  setFilter(key, value) {
    this.filters[key] = value;
    if (key !== 'page') {
      this.filters.page = 1;
    }
    this.loadProducts();
  }

  /**
   * Get filters
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filters = {
      category: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      inStock: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: '',
      page: 1,
      limit: 20
    };
    this.loadProducts();
  }

  /**
   * Apply filters
   */
  applyFilters(filters) {
    this.filters = { ...this.filters, ...filters, page: 1 };
    this.loadProducts();
  }

  /**
   * Go to page
   */
  goToPage(page) {
    this.filters.page = page;
    this.loadProducts();
  }

  /**
   * Get product categories
   */
  getCategories() {
    return this.categories;
  }

  /**
   * Get category by ID
   */
  getCategory(id) {
    return this.categories.find(c => c.id === id);
  }

  /**
   * Get category by slug
   */
  getCategoryBySlug(slug) {
    return this.categories.find(c => c.slug === slug);
  }

  /**
   * Get category tree
   */
  getCategoryTree() {
    return this.categories.filter(c => !c.parentId);
  }

  /**
   * Get subcategories
   */
  getSubcategories(categoryId) {
    return this.categories.filter(c => c.parentId === categoryId);
  }

  /**
   * Format product price
   */
  formatPrice(price) {
    return formatCurrency(price);
  }

  /**
   * Calculate product discount percentage
   */
  getDiscountPercentage(product) {
    if (!product.comparePrice || product.comparePrice <= product.price) {
      return 0;
    }
    return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
  }

  /**
   * Check if product is in stock
   */
  isInStock(product) {
    return product.stockQuantity > 0;
  }

  /**
   * Get stock status text
   */
  getStockStatus(product) {
    if (product.stockQuantity <= 0) {
      return { text: i18n.t('products.outOfStock'), class: 'out-of-stock' };
    }
    if (product.stockQuantity <= product.lowStockThreshold) {
      return { text: i18n.t('products.lowStock'), class: 'low-stock' };
    }
    return { text: i18n.t('products.inStock'), class: 'in-stock' };
  }

  /**
   * Get product rating
   */
  getRating(product) {
    return {
      average: product.averageRating || 0,
      count: product.totalReviews || 0,
      stars: this.getRatingStars(product.averageRating || 0)
    };
  }

  /**
   * Get rating stars
   */
  getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return {
      full: fullStars,
      half: halfStar,
      empty: emptyStars
    };
  }

  /**
   * Add listener for product changes
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
        callback({
          products: this.products,
          pagination: this.pagination,
          filters: this.filters
        });
      } catch (error) {
        console.error('Error in product listener:', error);
      }
    });
  }

  /**
   * Get product variants
   */
  getVariants(product) {
    return product.variants || [];
  }

  /**
   * Get product images
   */
  getImages(product) {
    return product.images || [];
  }

  /**
   * Get primary image
   */
  getPrimaryImage(product) {
    const images = this.getImages(product);
    return images.find(img => img.isPrimary) || images[0] || null;
  }

  /**
   * Get product attributes
   */
  getAttributes(product) {
    return product.attributes || [];
  }

  /**
   * Get attribute values
   */
  getAttributeValues(product, attributeName) {
    const attributes = this.getAttributes(product);
    return attributes
      .filter(attr => attr.attributeName === attributeName)
      .map(attr => attr.attributeValue);
  }

  /**
   * Get unique attribute names
   */
  getAttributeNames(product) {
    const attributes = this.getAttributes(product);
    return [...new Set(attributes.map(attr => attr.attributeName))];
  }
}

// Create singleton instance
const productService = new ProductService();

export default productService;