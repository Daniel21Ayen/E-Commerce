/**
 * App Module - Main application controller
 * Initializes and coordinates all modules and renders views into the DOM
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
      // 1. Initial Render of static Layout (Header & Footer)
      this.renderBaseLayout();

      // 2. Check authentication
      await this.checkAuth();

      // 3. Initialize modules
      await this.initModules();

      // 4. Setup event listeners
      this.setupEventListeners();

      // 5. Update UI state (auth links, cart counts, etc.)
      this.updateUI();

      // 6. Handle page-specific rendering & initialization
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
   * Render base layout structures into DOM containers
   */
  renderBaseLayout() {
    const headerEl = document.getElementById('main-header');
    const footerEl = document.getElementById('main-footer');

    if (headerEl) {
      headerEl.innerHTML = `
        <nav class="navbar">
          <div class="logo">
            <a href="/" data-page="home"><strong>E-Shop</strong></a>
          </div>
          <div class="search-bar">
            <input type="text" id="search-input" placeholder="Search products..." />
            <div id="search-results" class="search-dropdown" style="display:none;"></div>
          </div>
          <div class="nav-links">
            <a href="/products" data-page="products">Products</a>
            <a href="/cart" data-page="cart"><i class="fa fa-shopping-cart"></i> Cart</a>
            <a href="/wishlist" data-page="wishlist" data-auth="true"><i class="fa fa-heart"></i> Wishlist</a>
            <a href="/orders" data-page="orders" data-auth="true">Orders</a>
            <a href="/admin" data-page="admin" data-admin="true">Admin</a>
            <a href="/login" data-page="login" data-auth="false">Login</a>
            <a href="/register" data-page="register" data-auth="false">Register</a>
            <a href="#" data-action="logout" data-auth="true">Logout</a>
          </div>
        </nav>
      `;
    }

    if (footerEl) {
      footerEl.innerHTML = `
        <div class="footer-container">
          <p>&copy; <span data-year></span> E-Commerce App. All rights reserved.</p>
        </div>
      `;
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth() {
    try {
      const result = await AuthService.checkAuth();
      if (result.authenticated) {
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
        await cartService.init();
        await wishlistService.init();
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
      searchService.init();
      await productService.init();
      await productService.loadCategories();
      await productService.getFeatured();

      if (isAdmin()) {
        await adminService.loadDashboard();
        await adminService.loadProducts();
        await adminService.loadOrders();
        await adminService.loadInventory();
      }

      this.setupModuleListeners();
    } catch (error) {
      console.error('Module initialization error:', error);
    }
  }

  /**
   * Setup module listeners
   */
  setupModuleListeners() {
    cartService.addListener(() => this.updateUI());
    wishlistService.addListener(() => this.updateUI());
    productService.addListener(() => this.updateUI());
    orderService.addListener(() => this.updateUI());
    searchService.addListener((data) => this.updateSearchUI(data));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
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

    document.addEventListener('click', (e) => {
      const logoutBtn = e.target.closest('[data-action="logout"]');
      if (logoutBtn) {
        e.preventDefault();
        this.handleLogout();
      }
    });

    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('a[data-page]');
      if (navLink) {
        e.preventDefault();
        const page = navLink.dataset.page;
        this.navigateTo(page);
      }
    });

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

    document.addEventListener('click', (e) => {
      const wishlistBtn = e.target.closest('[data-action="wishlist-toggle"]');
      if (wishlistBtn) {
        e.preventDefault();
        const productId = wishlistBtn.dataset.productId;
        const variantId = wishlistBtn.dataset.variantId || null;
        this.handleWishlistToggle(productId, variantId);
      }
    });

    document.addEventListener('click', (e) => {
      const checkoutBtn = e.target.closest('[data-action="checkout"]');
      if (checkoutBtn) {
        e.preventDefault();
        this.handleCheckout();
      }
    });

    document.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('[data-action="cancel-order"]');
      if (cancelBtn) {
        e.preventDefault();
        const orderId = cancelBtn.dataset.orderId;
        this.handleCancelOrder(orderId);
      }
    });
  }

  // Handlers
  async handleLogin(form) {
    const formData = new FormData(form);
    const result = await AuthService.login(formData.get('email'), formData.get('password'));
    if (result.success) {
      this.navigateTo('home');
      await this.loadUserData();
    }
  }

  async handleRegister(form) {
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };
    const result = await AuthService.register(data);
    if (result.success) {
      this.navigateTo('home');
      await this.loadUserData();
    }
  }

  async handleLogout() {
    await AuthService.logout();
    this.navigateTo('login');
  }

  async handleAddToCart(productId, quantity, variantId) {
    await cartService.addItem(productId, quantity, variantId);
  }

  async handleWishlistToggle(productId, variantId) {
    await wishlistService.toggleItem(productId, variantId);
  }

  async handleCheckout() {
    const cart = cartService.getCart();
    if (!cart || cart.items?.length === 0) {
      showNotification('Your cart is empty', 'warning');
      return;
    }
    this.navigateTo('checkout');
  }

  async handleCancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
      await orderService.cancelOrder(orderId);
    }
  }

  navigateTo(page) {
    this.currentPage = page;
    this.initPage();
    window.history.pushState({ page }, '', `/${page}`);
  }

  /**
   * Initialize page & render content into #page-content
   */
  async initPage() {
    const page = this.getCurrentPage();
    this.currentPage = page;

    this.updateMetaTags(page);
    const container = document.getElementById('page-content');
    if (!container) return;

    switch (page) {
      case 'home':
        await this.initHomePage(container);
        break;
      case 'products':
        await this.initProductsPage(container);
        break;
      case 'cart':
        await this.initCartPage(container);
        break;
      case 'login':
        await this.initLoginPage(container);
        break;
      case 'register':
        await this.initRegisterPage(container);
        break;
      default:
        container.innerHTML = `<h2>Page Not Found</h2><p>The page dynamic route is under construction.</p>`;
        break;
    }
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const page = path.replace(/^\//, '').split('/')[0] || 'home';
    return page;
  }

  updateUI() {
    this.updateHeader();
    this.updateFooter();
  }

  updateHeader() {
    const isAuth = isAuthenticated();
    const showAdmin = isAdmin();

    document.querySelectorAll('[data-auth]').forEach((el) => {
      const showAuth = el.dataset.auth === 'true';
      el.style.display = showAuth === isAuth ? '' : 'none';
    });

    document.querySelectorAll('[data-admin]').forEach((el) => {
      el.style.display = showAdmin ? '' : 'none';
    });
  }

  updateFooter() {
    const yearEl = document.querySelector('[data-year]');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  updateSearchUI(data) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (data.active && data.suggestions?.length > 0) {
      container.style.display = 'block';
      this.renderSearchSuggestions(container, data.suggestions, data.query);
    } else {
      container.style.display = 'none';
    }
  }

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
  }

  highlightText(text, query) {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  updateMetaTags(page) {
    const meta = generateMetaTags(this.getPageTitle(page), this.getPageDescription(page), '/default-og-image.jpg');
    for (const [key, value] of Object.entries(meta)) {
      const tag = document.querySelector(`meta[property="${key}"]`) || document.querySelector(`meta[name="${key}"]`);
      if (tag) tag.content = value;
    }
  }

  getPageTitle(page) {
    const titles = { home: 'Home', products: 'Products', cart: 'Cart', login: 'Login', register: 'Register' };
    return titles[page] || page;
  }

  getPageDescription(page) {
    return 'E-Commerce Online Store';
  }

  // Page HTML Content Renderers
  async initHomePage(container) {
    const products = await productService.getFeatured();
    container.innerHTML = `
      <section class="hero">
        <h1>Welcome to E-Commerce Store</h1>
        <p>Discover products with the best prices.</p>
      </section>
      <section class="featured-products">
        <h2>Featured Products</h2>
        <div class="product-grid">
          ${products && products.length > 0 ? products.map(p => `
            <div class="product-card">
              <h3>${p.name}</h3>
              <p>${formatCurrency(p.price)}</p>
              <button data-action="add-to-cart" data-product-id="${p.id || p._id}">Add to Cart</button>
            </div>
          `).join('') : '<p>No featured products found.</p>'}
        </div>
      </section>
    `;
  }

  async initProductsPage(container) {
    const products = await productService.loadProducts();
    container.innerHTML = `
      <h2>Product Catalog</h2>
      <div class="product-grid">
        ${products && products.length > 0 ? products.map(p => `
          <div class="product-card">
            <h3>${p.name}</h3>
            <p>${formatCurrency(p.price)}</p>
            <button data-action="add-to-cart" data-product-id="${p.id || p._id}">Add to Cart</button>
          </div>
        `).join('') : '<p>No products available.</p>'}
      </div>
    `;
  }

  async initCartPage(container) {
    const cart = cartService.getCart();
    container.innerHTML = `
      <h2>Your Cart</h2>
      ${cart && cart.items && cart.items.length > 0 ? `
        <div class="cart-items">
          ${cart.items.map(item => `<p>${item.name || 'Item'} x ${item.quantity}</p>`).join('')}
        </div>
        <button data-action="checkout">Proceed to Checkout</button>
      ` : '<p>Your cart is empty.</p>'}
    `;
  }

  async initLoginPage(container) {
    if (isAuthenticated()) {
      this.navigateTo('home');
      return;
    }
    container.innerHTML = `
      <h2>Login</h2>
      <form data-action="login">
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Sign In</button>
      </form>
    `;
  }

  async initRegisterPage(container) {
    if (isAuthenticated()) {
      this.navigateTo('home');
      return;
    }
    container.innerHTML = `
      <h2>Register</h2>
      <form data-action="register">
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
      </form>
    `;
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

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

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

window.addEventListener('popstate', () => {
  app.initPage();
});

export default app;