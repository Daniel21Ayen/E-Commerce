// frontend/src/js/app.js

import ApiService from './modules/api.js';
import AuthService, { isAuthenticated, isAdmin, getUser } from './modules/auth.js';
import cartService from './modules/cart.js';
import productService from './modules/products.js';
import wishlistService from './modules/wishlist.js';
import reviewService from './modules/reviews.js';
import orderService from './modules/orders.js';
import searchService from './modules/search.js';
import adminService from './modules/admin.js';
import { showNotification, generateMetaTags, formatCurrency, updateCartBadge, updateWishlistBadge } from './modules/utils.js';

// Import auth pages
import LoginPage from './pages/auth/LoginPage.js';
import RegisterPage from './pages/auth/RegisterPage.js';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.js';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.js';

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
        this.currentPage = 'home';
        this.listeners = [];

        // Define page handlers - Make sure ALL methods exist
        this.pageHandlers = {
            home: this.renderHome.bind(this),
            products: this.renderProducts.bind(this),
            product: this.renderProductDetail.bind(this),
            cart: this.renderCart.bind(this),
            checkout: this.renderCheckout.bind(this),
            orders: this.renderOrders.bind(this),
            wishlist: this.renderWishlist.bind(this),
            profile: this.renderProfile.bind(this),
            admin: this.renderAdmin.bind(this),
            login: this.renderLoginPage.bind(this),
            register: this.renderRegisterPage.bind(this),
            'forgot-password': this.renderForgotPasswordPage.bind(this),
            'reset-password': this.renderResetPasswordPage.bind(this)
        };
    }

    /**
     * Initialize app
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing app...');
            this.renderBaseLayout();
            await this.checkAuth();
            console.log('✅ Auth checked');
            await this.initModules();
            console.log('✅ Modules initialized');
            this.setupEventListeners();
            console.log('✅ Event listeners set up');
            this.updateUI();
            await this.initPage();
            console.log('✅ Page rendered');
            this.initialized = true;
            this.notifyListeners('init', { success: true });
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization error:', error);
            showNotification('An error occurred during initialization', 'error');
        }
    }

    /**
     * Render base layout
     */
    renderBaseLayout() {
        const headerEl = document.getElementById('main-header');
        const footerEl = document.getElementById('main-footer');

        if (headerEl) {
            headerEl.innerHTML = `
                <header class="header">
                    <div class="header-inner">
                        <a href="/" class="logo" data-page="home">
                            <span class="logo-icon">🛍️</span>
                            <span>E-Shop</span>
                        </a>
                        <div class="header-search" id="search-container">
                            <input type="text" class="form-control" id="search-input" placeholder="Search products..." />
                            <button class="search-btn" id="search-btn"><i class="fas fa-search"></i></button>
                            <div id="search-results" class="search-results"></div>
                        </div>
                        <div class="header-actions">
                            <a href="/wishlist" class="btn" data-page="wishlist" data-auth="true">
                                <i class="fas fa-heart"></i>
                                <span class="badge" id="wishlist-badge" style="display:none;">0</span>
                            </a>
                            <a href="/cart" class="btn" data-page="cart">
                                <i class="fas fa-shopping-cart"></i>
                                <span class="badge" id="cart-badge" style="display:none;">0</span>
                            </a>
                            <div class="dropdown">
                                <button class="btn" id="userMenuBtn"><i class="fas fa-user"></i></button>
                                <div class="dropdown-menu" id="userDropdown">
                                    <div data-auth="false">
                                        <a href="/login" class="dropdown-item" data-page="login">Login</a>
                                        <a href="/register" class="dropdown-item" data-page="register">Register</a>
                                    </div>
                                    <div data-auth="true" style="display:none;">
                                        <div class="dropdown-header">
                                            <span class="user-name" id="userName">User</span>
                                            <span class="user-email" id="userEmail">user@email.com</span>
                                        </div>
                                        <a href="/profile" class="dropdown-item" data-page="profile">Profile</a>
                                        <a href="/orders" class="dropdown-item" data-page="orders">Orders</a>
                                        <a href="/wishlist" class="dropdown-item" data-page="wishlist">Wishlist</a>
                                        <a href="/admin" class="dropdown-item" data-page="admin" data-admin="true">Admin</a>
                                        <button class="dropdown-item text-danger" data-action="logout">Logout</button>
                                    </div>
                                </div>
                            </div>
                            <button class="mobile-toggle" id="mobileToggle"><i class="fas fa-bars"></i></button>
                        </div>
                    </div>
                </header>
            `;
        }

        if (footerEl) {
            footerEl.innerHTML = `
                <footer class="footer">
                    <div class="container">
                        <div class="footer-bottom">
                            <p>&copy; <span data-year></span> E-Shop. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            `;
        }
    }

    /**
     * Check authentication
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
        // Navigation
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('a[data-page]');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                this.navigateTo(page);
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

        // Mobile toggle
        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('#mobileToggle');
            if (toggle) {
                e.preventDefault();
                document.getElementById('mobileNav')?.classList.toggle('active');
            }
        });

        // User menu dropdown
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#userMenuBtn');
            const dropdown = document.getElementById('userDropdown');
            if (btn && dropdown) {
                e.preventDefault();
                dropdown.classList.toggle('show');
            } else if (dropdown) {
                dropdown.classList.remove('show');
            }
        });

        // Search
        document.addEventListener('input', (e) => {
            const input = e.target.closest('#search-input');
            if (input) {
                searchService.handleInput(input.value);
            }
        });

        // Popstate
        window.addEventListener('popstate', () => {
            this.initPage();
        });
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        await AuthService.logout();
        this.navigateTo('login');
    }

    /**
     * Update UI
     */
    updateUI() {
        this.updateHeader();
        this.updateFooter();
        this.updateBadges();
    }

    /**
     * Update header
     */
    updateHeader() {
        const isAuth = isAuthenticated();
        const user = getUser();
        const showAdmin = isAdmin();

        document.querySelectorAll('[data-auth]').forEach((el) => {
            const showAuth = el.dataset.auth === 'true';
            el.style.display = showAuth === isAuth ? '' : 'none';
        });

        document.querySelectorAll('[data-admin]').forEach((el) => {
            el.style.display = showAdmin ? '' : 'none';
        });

        if (user) {
            const nameEl = document.getElementById('userName');
            const emailEl = document.getElementById('userEmail');
            if (nameEl) nameEl.textContent = user.name || 'User';
            if (emailEl) emailEl.textContent = user.email || '';
        }
    }

    /**
     * Update footer
     */
    updateFooter() {
        const yearEl = document.querySelector('[data-year]');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    }

    /**
     * Update badges
     */
    updateBadges() {
        const cartCount = cartService.getItemCount();
        const wishlistCount = wishlistService.getCount();
        updateCartBadge(cartCount);
        updateWishlistBadge(wishlistCount);
    }

    /**
     * Update search UI
     */
    updateSearchUI(data) {
        const container = document.getElementById('search-results');
        if (!container) return;
        if (data.active && data.suggestions?.length > 0) {
            container.style.display = 'block';
            container.innerHTML = data.suggestions.map(p => `
                <div class="search-suggestion" data-product-id="${p.id}">
                    <img src="${p.images?.[0]?.imageUrl || '/placeholder.jpg'}" />
                    <div class="suggestion-info">
                        <div class="suggestion-name">${p.name}</div>
                        <div class="suggestion-price">${formatCurrency(p.price)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.style.display = 'none';
        }
    }

    /**
     * Get current page
     */
    getCurrentPage() {
        const path = window.location.pathname;
        return path.replace(/^\//, '').split('/')[0] || 'home';
    }

    /**
     * Navigate to page
     */
    navigateTo(page, params = {}) {
        this.currentPage = page;
        const url = page === 'home' ? '/' : `/${page}`;
        window.history.pushState({ page, params }, '', url);
        this.initPage();
    }

    /**
     * Initialize page
     */
    async initPage() {
        const page = this.getCurrentPage();
        this.currentPage = page;
        this.updateMetaTags(page);
        this.updateActiveNav(page);

        const container = document.getElementById('page-content');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;

        try {
            const handler = this.pageHandlers[page];
            if (handler) {
                await handler(container);
            } else {
                this.renderNotFound(container);
            }
        } catch (error) {
            console.error('Page render error:', error);
            container.innerHTML = `
                <div class="error-page">
                    <h2>Error Loading Page</h2>
                    <p>${error.message || 'Something went wrong'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    /**
     * Update meta tags
     */
    updateMetaTags(page) {
        const titles = {
            home: 'Home',
            products: 'Products',
            cart: 'Cart',
            login: 'Login',
            register: 'Register'
        };
        document.title = `${titles[page] || page} | E-Shop`;
    }

    /**
     * Update active nav
     */
    updateActiveNav(page) {
        document.querySelectorAll('[data-page]').forEach(el => {
            const linkPage = el.dataset.page;
            el.classList.toggle('active', linkPage === page);
        });
    }

    /**
     * Render not found
     */
    renderNotFound(container) {
        container.innerHTML = `
            <div class="error-page text-center">
                <i class="fas fa-exclamation-triangle" style="font-size:64px;color:var(--gray-400);"></i>
                <h1>404</h1>
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" class="btn btn-primary" data-page="home">Go Home</a>
            </div>
        `;
    }

    // ============================================
    // AUTH PAGE RENDERERS
    // ============================================

    async renderLoginPage(container) {
        const page = new LoginPage({
            app: this,
            onLogin: async (user) => {
                await this.loadUserData();
                this.updateUI();
            }
        });
        page.mount(container);
    }

    async renderRegisterPage(container) {
        const page = new RegisterPage({
            app: this,
            onRegister: async (user) => {
                await this.loadUserData();
                this.updateUI();
            }
        });
        page.mount(container);
    }

    async renderForgotPasswordPage(container) {
        const page = new ForgotPasswordPage({ app: this });
        page.mount(container);
    }

    async renderResetPasswordPage(container) {
        const path = window.location.pathname;
        const token = path.split('/').pop();
        const page = new ResetPasswordPage({ app: this, token });
        page.mount(container);
    }

    // ============================================
    // PAGE RENDERERS - STUB METHODS
    // ============================================

    async renderHome(container) {
        container.innerHTML = `
            <div class="home-page fade-in">
                <section class="hero-section">
                    <div class="hero-content">
                        <h1>Welcome to E-Shop</h1>
                        <p>Discover amazing products at unbeatable prices.</p>
                        <a href="/products" class="btn btn-primary" data-page="products">Start Shopping</a>
                    </div>
                </section>
                <section class="products-section">
                    <h2>Featured Products</h2>
                    <div class="products-grid" id="featuredProducts">
                        <p class="text-muted">Loading products...</p>
                    </div>
                </section>
            </div>
        `;
    }

    async renderProducts(container) {
        container.innerHTML = `
            <div class="products-page fade-in">
                <h1>All Products</h1>
                <div class="products-grid" id="productsGrid">
                    <p class="text-muted">Loading products...</p>
                </div>
            </div>
        `;
    }

    async renderProductDetail(container) {
        container.innerHTML = `
            <div class="product-detail-page fade-in">
                <h1>Product Details</h1>
                <p class="text-muted">Loading product...</p>
            </div>
        `;
    }

    async renderCart(container) {
        container.innerHTML = `
            <div class="cart-page fade-in">
                <h1>Shopping Cart</h1>
                <div class="cart-container">
                    <p class="text-muted">Loading cart...</p>
                </div>
            </div>
        `;
    }

    async renderCheckout(container) {
        container.innerHTML = `
            <div class="checkout-page fade-in">
                <h1>Checkout</h1>
                <p class="text-muted">Loading checkout...</p>
            </div>
        `;
    }

    async renderOrders(container) {
        container.innerHTML = `
            <div class="orders-page fade-in">
                <h1>My Orders</h1>
                <p class="text-muted">Loading orders...</p>
            </div>
        `;
    }

    async renderWishlist(container) {
        container.innerHTML = `
            <div class="wishlist-page fade-in">
                <h1>My Wishlist</h1>
                <p class="text-muted">Loading wishlist...</p>
            </div>
        `;
    }

    async renderProfile(container) {
        container.innerHTML = `
            <div class="profile-page fade-in">
                <h1>My Profile</h1>
                <p class="text-muted">Loading profile...</p>
            </div>
        `;
    }

    async renderAdmin(container) {
        container.innerHTML = `
            <div class="admin-page fade-in">
                <h1>Admin Dashboard</h1>
                <p class="text-muted">Loading admin dashboard...</p>
            </div>
        `;
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
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle browser navigation
window.addEventListener('popstate', () => {
    app.initPage();
});

export default app;