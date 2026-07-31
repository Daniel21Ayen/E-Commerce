/**
 * App Module - Main application controller
 * Initializes and coordinates all modules
 */

import ApiService from './modules/api';
import AuthService, { isAuthenticated, isAdmin, getUser } from './modules/auth';
import cartService from './modules/cart';
import productService from './modules/products';
import wishlistService from './modules/wishlist';
import reviewService from './modules/reviews';
import orderService from './modules/orders';
import searchService from './modules/search';
import adminService from './modules/admin';
import { showNotification, generateMetaTags, formatCurrency } from './modules/utils';

class App {
  constructor() {
    this.modules = {
      auth: AuthService,
      cart: cartService,
      products: productService,
      wishlist: wishlistService,
      reviews: reviewService,
      orders: orderService,
      search: searchService,
      admin: adminService
    };
    this.initialized = false;
    this.currentPage = null;
    this.listeners = [];
  }

  /**
   * Initialize app
   */
  async init() {
    if (this.initialized) return;

    try {
      // Check authentication
      await this.checkAuth();

      // Initialize modules
      await this.initModules();

      // Setup event listeners
      this.setupEventListeners();

      // Update UI
      this.updateUI();

      // Handle page-specific initialization
      await this.initPage();

      this.initialized = true;
      this.notifyListeners('init', { success: true });

      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      showNotification('An error occurred during initialization', 'error');
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth() {
    try {
      const result = await AuthService.checkAuth();
      if (result.authenticated) {
        // Load user data
        await this.loadUserData();
      }
      return result;
    } catch (error) {
      console.error('Auth check error:', error);
      return { authenticated: false };
    }
  }

  /**
   * Load user data
   */
  async loadUserData() {
    try {
      const user = getUser();
      if (user) {
        // Load cart
        await cartService.init();

        // Load wishlist
        await wishlistService.init();

        // Load orders
        await orderService.loadOrders();
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  /**
   * Initialize modules
   */
  async initModules() {
    try {
      // Initialize search
      searchService.init();

      // Load products
      await productService.init();

      // Load categories
      await productService.loadCategories();

      // Load featured products
      await productService.getFeatured();

      // Load admin data if admin
      if (isAdmin()) {
        await adminService.loadDashboard();
        await adminService.loadProducts();
        await adminService.loadOrders();
        await adminService.loadInventory();
      }

      // Setup module listeners
      this.setupModuleListeners();
    } catch (error) {
      console.error('Module initialization error:', error);
    }
  }

  /**
   * Setup module listeners
   */
  setupModuleListeners() {
    // Cart listeners
    cartService.addListener((cart) => {
      this.updateUI();
    });

    // Wishlist listeners
    wishlistService.addListener((items) => {
      this.updateUI();
    });

    // Product listeners
    productService.addListener((data) => {
      this.updateUI();
    });

    // Order listeners
    orderService.addListener((orders) => {
      this.updateUI();
    });

    // Search listeners
    searchService.addListener((data) => {
      this.updateSearchUI(data);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Login/Register forms
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('form');
      if (!form) return;

      const action = form.dataset.action;
      if (action === 'login') {
        e.preventDefault();
        this.handleLogin(form);
      } else if (action === 'register') {
        e.preventDefault();
        this.handleRegister(form);
      } else if (action === 'forgot-password') {
        e.preventDefault();
        this.handleForgotPassword(form);
      } else if (action === 'reset-password') {
        e.preventDefault();
        this.handleResetPassword(form);
      }
    });

    // Logout
    document.addEventListener('click', (e) => {
      const logoutBtn = e.target.closest('[data-action="logout"]');
      if (logoutBtn) {
        e.preventDefault();
        this.handleLogout();
      }
    });

    // Navigation
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('a[data-page]');
      if (navLink) {
        e.preventDefault();
        const page = navLink.dataset.page;
        this.navigateTo(page);
      }
    });

    // Cart actions
    document.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
      if (addToCartBtn) {
        e.preventDefault();
        const productId = addToCartBtn.dataset.productId;
        const variantId = addToCartBtn.dataset.variantId || null;
        const quantity = parseInt(addToCartBtn.dataset.quantity) || 1;
        this.handleAddToCart(productId, quantity, variantId);
      }
    });

    // Wishlist actions
    document.addEventListener('click', (e) => {
      const wishlistBtn = e.target.closest('[data-action="wishlist-toggle"]');
      if (wishlistBtn) {
        e.preventDefault();
        const productId = wishlistBtn.dataset.productId;
        const variantId = wishlistBtn.dataset.variantId || null;
        this.handleWishlistToggle(productId, variantId);
      }
    });

    // Review actions
    document.addEventListener('click', (e) => {
      const reviewBtn = e.target.closest('[data-action="review-submit"]');
      if (reviewBtn) {
        e.preventDefault();
        const form = reviewBtn.closest('form');
        if (form) {
          this.handleReviewSubmit(form);
        }
      }
    });

    // Checkout
    document.addEventListener('click', (e) => {
      const checkoutBtn = e.target.closest('[data-action="checkout"]');
      if (checkoutBtn) {
        e.preventDefault();
        this.handleCheckout();
      }
    });

    // Order cancellation
    document.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('[data-action="cancel-order"]');
      if (cancelBtn) {
        e.preventDefault();
        const orderId = cancelBtn.dataset.orderId;
        this.handleCancelOrder(orderId);
      }
    });

    // Infinite scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          if (target.dataset.action === 'load-more') {
            this.loadMoreProducts();
          }
        }
      });
    });

    document.querySelectorAll('[data-observe]').forEach((el) => {
      observer.observe(el);
    });
  }

  /**
   * Handle login
   */
  async handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    const result = await AuthService.login(email, password);
    if (result.success) {
      this.navigateTo('home');
      await this.loadUserData();
    }
  }

  /**
   * Handle register
   */
  async handleRegister(form) {
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      phone: formData.get('phone') || null,
      address: formData.get('address') ? JSON.parse(formData.get('address')) : null
    };

    const result = await AuthService.register(data);
    if (result.success) {
      this.navigateTo('home');
      await this.loadUserData();
    }
  }

  /**
   * Handle forgot password
   */
  async handleForgotPassword(form) {
    const formData = new FormData(form);
    const email = formData.get('email');

    await AuthService.forgotPassword(email);
  }

  /**
   * Handle reset password
   */
  async handleResetPassword(form) {
    const formData = new FormData(form);
    const token = form.dataset.token;
    const password = formData.get('password');

    await AuthService.resetPassword(token, password);
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    await AuthService.logout();
    this.navigateTo('login');
  }

  /**
   * Handle add to cart
   */
  async handleAddToCart(productId, quantity, variantId) {
    await cartService.addItem(productId, quantity, variantId);
  }

  /**
   * Handle wishlist toggle
   */
  async handleWishlistToggle(productId, variantId) {
    await wishlistService.toggleItem(productId, variantId);
  }

  /**
   * Handle review submit
   */
  async handleReviewSubmit(form) {
    const formData = new FormData(form);
    const data = {
      productId: form.dataset.productId,
      rating: parseInt(formData.get('rating')),
      title: formData.get('title'),
      description: formData.get('description'),
      images: formData.get('images') ? JSON.parse(formData.get('images')) : null
    };

    await reviewService.createReview(data);
  }

  /**
   * Handle checkout
   */
  async handleCheckout() {
    const cart = cartService.getCart();
    if (!cart || cart.items.length === 0) {
      showNotification('Your cart is empty', 'warning');
      return;
    }

    this.navigateTo('checkout');
  }

  /**
   * Handle cancel order
   */
  async handleCancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
      await orderService.cancelOrder(orderId);
    }
  }

  /**
   * Load more products
   */
  async loadMoreProducts() {
    const pagination = productService.getPagination();
    if (pagination && pagination.currentPage < pagination.pages) {
      const nextPage = pagination.currentPage + 1;
      await productService.goToPage(nextPage);
    }
  }

  /**
   * Navigate to page
   */
  navigateTo(page) {
    this.currentPage = page;
    this.initPage();
    window.history.pushState({ page }, '', `/${page}`);
  }

  /**
   * Initialize page
   */
  async initPage() {
    const page = this.getCurrentPage();
    this.currentPage = page;

    // Update meta tags
    this.updateMetaTags(page);

    // Page-specific initialization
    switch (page) {
      case 'home':
        await this.initHomePage();
        break;
      case 'products':
        await this.initProductsPage();
        break;
      case 'product-detail':
        await this.initProductDetailPage();
        break;
      case 'cart':
        await this.initCartPage();
        break;
      case 'checkout':
        await this.initCheckoutPage();
        break;
      case 'orders':
        await this.initOrdersPage();
        break;
      case 'wishlist':
        await this.initWishlistPage();
        break;
      case 'profile':
        await this.initProfilePage();
        break;
      case 'admin':
        await this.initAdminPage();
        break;
      case 'login':
        await this.initLoginPage();
        break;
      case 'register':
        await this.initRegisterPage();
        break;
      default:
        break;
    }
  }

  /**
   * Get current page
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.replace(/^\//, '').split('/')[0] || 'home';
    return page;
  }

  /**
   * Update UI
   */
  updateUI() {
    this.updateHeader();
    this.updateFooter();
    this.updateUserMenu();
  }

  /**
   * Update header
   */
  updateHeader() {
    const isAuth = isAuthenticated();
    const user = getUser();

    // Update auth links
    document.querySelectorAll('[data-auth]').forEach((el) => {
      const showAuth = el.dataset.auth === 'true';
      el.style.display = showAuth === isAuth ? '' : 'none';
    });

    // Update user info
    if (user) {
      const nameEl = document.querySelector('[data-user-name]');
      if (nameEl) nameEl.textContent = user.name;

      const avatarEl = document.querySelector('[data-user-avatar]');
      if (avatarEl) {
        avatarEl.src =
          user.profile?.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
      }
    }

    // Update admin links
    const showAdmin = isAdmin();
    document.querySelectorAll('[data-admin]').forEach((el) => {
      el.style.display = showAdmin ? '' : 'none';
    });
  }

  /**
   * Update footer
   */
  updateFooter() {
    const year = new Date().getFullYear();
    const yearEl = document.querySelector('[data-year]');
    if (yearEl) yearEl.textContent = year;
  }

  /**
   * Update user menu
   */
  updateUserMenu() {
    const isAuth = isAuthenticated();
    const menu = document.querySelector('.user-menu');
    if (!menu) return;

    if (isAuth) {
      menu.classList.remove('guest');
      menu.classList.add('authenticated');
    } else {
      menu.classList.remove('authenticated');
      menu.classList.add('guest');
    }
  }

  /**
   * Update search UI
   */
  updateSearchUI(data) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (data.active && data.suggestions.length > 0) {
      container.style.display = 'block';
      this.renderSearchSuggestions(container, data.suggestions, data.query);
    } else {
      container.style.display = 'none';
    }
  }

  /**
   * Render search suggestions
   */
  renderSearchSuggestions(container, suggestions, query) {
    const html = suggestions
      .map(
        (product) => `
      <div class="search-suggestion" data-product-id="${product.id}">
        <img src="${product.images?.[0]?.imageUrl || '/placeholder.jpg'}" alt="${product.name}" />
        <div class="suggestion-info">
          <div class="suggestion-name">${this.highlightText(product.name, query)}</div>
          <div class="suggestion-price">${formatCurrency(product.price)}</div>
        </div>
      </div>
    `
      )
      .join('');

    container.innerHTML = html;

    // Add click listeners
    container.querySelectorAll('.search-suggestion').forEach((el) => {
      el.addEventListener('click', () => {
        const productId = el.dataset.productId;
        this.navigateTo(`product/${productId}`);
      });
    });
  }

  /**
   * Highlight text
   */
  highlightText(text, query) {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Update meta tags
   */
  updateMetaTags(page) {
    const meta = generateMetaTags(
      this.getPageTitle(page),
      this.getPageDescription(page),
      this.getPageImage(page)
    );

    for (const [key, value] of Object.entries(meta)) {
      const tag =
        document.querySelector(`meta[property="${key}"]`) ||
        document.querySelector(`meta[name="${key}"]`);
      if (tag) {
        tag.content = value;
      }
    }
  }

  /**
   * Get page title
   */
  getPageTitle(page) {
    const titles = {
      home: 'Home',
      products: 'Products',
      'product-detail': 'Product Details',
      cart: 'Shopping Cart',
      checkout: 'Checkout',
      orders: 'My Orders',
      wishlist: 'Wishlist',
      profile: 'Profile',
      admin: 'Admin Dashboard',
      login: 'Login',
      register: 'Register'
    };
    return titles[page] || page;
  }

  /**
   * Get page description
   */
  getPageDescription(page) {
    const descriptions = {
      home: 'Welcome to E-Commerce - Your one-stop shop',
      products: 'Browse our wide range of products',
      cart: 'Review your shopping cart',
      checkout: 'Complete your order',
      orders: 'View your order history',
      wishlist: 'Your saved items'
    };
    return descriptions[page] || '';
  }

  /**
   * Get page image
   */
  getPageImage(page) {
    return '/default-og-image.jpg';
  }

  /**
   * Page initializers
   */
  async initHomePage() {
    // Load featured products
    await productService.getFeatured();

    // Load categories
    await productService.loadCategories();
  }

  async initProductsPage() {
    await productService.loadProducts();
  }

  async initProductDetailPage() {
    const path = window.location.pathname;
    const id = path.split('/').pop();
    await productService.getProduct(id);
  }

  async initCartPage() {
    await cartService.init();
  }

  async initCheckoutPage() {
    const cart = cartService.getCart();
    if (!cart || cart.items.length === 0) {
      this.navigateTo('cart');
    }
  }

  async initOrdersPage() {
    await orderService.loadOrders();
  }

  async initWishlistPage() {
    await wishlistService.loadWishlist();
  }

  async initProfilePage() {
    await AuthService.getProfile();
  }

  async initAdminPage() {
    if (!isAdmin()) {
      this.navigateTo('home');
      return;
    }
    await adminService.loadDashboard();
    await adminService.loadProducts();
    await adminService.loadOrders();
    await adminService.loadInventory();
    await adminService.loadSalesAnalytics();
    await adminService.loadProductAnalytics();
    await adminService.loadCustomerAnalytics();
  }

  async initLoginPage() {
    if (isAuthenticated()) {
      this.navigateTo('home');
    }
  }

  async initRegisterPage() {
    if (isAuthenticated()) {
      this.navigateTo('home');
    }
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
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in app listener:', error);
      }
    });
  }
}

// Create singleton instance
const app = new App();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
  app.initPage();
});

export default app;