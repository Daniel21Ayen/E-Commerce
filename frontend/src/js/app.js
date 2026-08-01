// frontend/src/js/app.js

import AuthService, { isAuthenticated, isAdmin, getUser } from './modules/auth.js';
import cartService from './modules/cart.js';
import productService from './modules/products.js';
import wishlistService from './modules/wishlist.js';
import reviewService from './modules/reviews.js';
import orderService from './modules/orders.js';
import searchService from './modules/search.js';
import adminService from './modules/admin.js';
import { showNotification, formatCurrency, updateCartBadge, updateWishlistBadge } from './modules/utils.js';

// Import auth pages
import LoginPage from './pages/auth/LoginPage.js';
import RegisterPage from './pages/auth/RegisterPage.js';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.js';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.js';
import SocialLoginPage from './pages/SocialLoginPage.js';

class App {
    constructor() {
        // Initialize all modules
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

        // App state
        this.initialized = false;
        this.currentPage = 'home';
        this.listeners = [];
        this.user = null;
        this.loading = false;

        // Page handlers - ALL pages with proper binding
        this.pageHandlers = {
            // Main pages
            home: this.renderHome.bind(this),
            products: this.renderProducts.bind(this),
            product: this.renderProductDetail.bind(this),
            cart: this.renderCart.bind(this),
            checkout: this.renderCheckout.bind(this),
            orders: this.renderOrders.bind(this),
            wishlist: this.renderWishlist.bind(this),
            profile: this.renderProfile.bind(this),
            admin: this.renderAdmin.bind(this),
            
            // Auth pages
            login: this.renderLoginPage.bind(this),
            register: this.renderRegisterPage.bind(this),
            'forgot-password': this.renderForgotPasswordPage.bind(this),
            'reset-password': this.renderResetPasswordPage.bind(this),
            'social-login': this.renderSocialLoginPage.bind(this),
            
            // Fallback
            '404': this.renderNotFound.bind(this)
        };

        // Route aliases
        this.routeAliases = {
            'signin': 'login',
            'signup': 'register',
            'sign-out': 'logout',
            'my-account': 'profile',
            'my-orders': 'orders',
            'my-wishlist': 'wishlist'
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
     * Render base layout (Header & Footer)
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
                            <!-- Wishlist -->
                            <a href="/wishlist" class="btn" data-page="wishlist" aria-label="Wishlist">
                                <i class="fas fa-heart"></i>
                                <span class="badge" id="wishlist-badge" style="display:none;">0</span>
                            </a>
                            
                            <!-- Cart -->
                            <a href="/cart" class="btn" data-page="cart" aria-label="Cart">
                                <i class="fas fa-shopping-cart"></i>
                                <span class="badge" id="cart-badge" style="display:none;">0</span>
                            </a>
                            
                            <!-- User Menu -->
                            <div class="dropdown">
                                <button class="btn" id="userMenuBtn" aria-label="User Menu">
                                    <i class="fas fa-user"></i>
                                </button>
                                <div class="dropdown-menu" id="userDropdown">
                                    <!-- Guest Menu (Logged Out) -->
                                    <div id="guestMenu">
                                        <a href="/login" class="dropdown-item" data-page="login">
                                            <i class="fas fa-sign-in-alt"></i> Login
                                        </a>
                                        <a href="/register" class="dropdown-item" data-page="register">
                                            <i class="fas fa-user-plus"></i> Register
                                        </a>
                                    </div>
                                    
                                    <!-- User Menu (Logged In) -->
                                    <div id="userMenu" style="display:none;">
                                        <div class="dropdown-header">
                                            <span class="user-name" id="userName">User</span>
                                            <span class="user-email" id="userEmail">user@email.com</span>
                                        </div>
                                        <div class="dropdown-divider"></div>
                                        <a href="/profile" class="dropdown-item" data-page="profile">
                                            <i class="fas fa-user-circle"></i> Profile
                                        </a>
                                        <a href="/orders" class="dropdown-item" data-page="orders">
                                            <i class="fas fa-box"></i> Orders
                                        </a>
                                        <a href="/wishlist" class="dropdown-item" data-page="wishlist">
                                            <i class="fas fa-heart"></i> Wishlist
                                        </a>
                                        <a href="/admin" class="dropdown-item" data-page="admin" id="adminLink" style="display:none;">
                                            <i class="fas fa-tachometer-alt"></i> Admin Dashboard
                                        </a>
                                        <div class="dropdown-divider"></div>
                                        <button class="dropdown-item text-danger" data-action="logout">
                                            <i class="fas fa-sign-out-alt"></i> Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Mobile Toggle -->
                            <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle Menu">
                                <i class="fas fa-bars"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mobile Navigation -->
                    <nav class="mobile-nav" id="mobileNav">
                        <ul>
                            <li><a href="/" data-page="home"><i class="fas fa-home"></i> Home</a></li>
                            <li><a href="/products" data-page="products"><i class="fas fa-box"></i> Products</a></li>
                            <li><a href="/cart" data-page="cart"><i class="fas fa-shopping-cart"></i> Cart</a></li>
                            <li><a href="/wishlist" data-page="wishlist"><i class="fas fa-heart"></i> Wishlist</a></li>
                            
                            <!-- Guest Menu (Mobile) -->
                            <div id="mobileGuestMenu">
                                <li><a href="/login" data-page="login"><i class="fas fa-sign-in-alt"></i> Login</a></li>
                                <li><a href="/register" data-page="register"><i class="fas fa-user-plus"></i> Register</a></li>
                            </div>
                            
                            <!-- User Menu (Mobile) -->
                            <div id="mobileUserMenu" style="display:none;">
                                <li><a href="/profile" data-page="profile"><i class="fas fa-user-circle"></i> Profile</a></li>
                                <li><a href="/orders" data-page="orders"><i class="fas fa-box"></i> Orders</a></li>
                                <li><a href="/admin" data-page="admin" id="mobileAdminLink" style="display:none;">
                                    <i class="fas fa-tachometer-alt"></i> Admin
                                </a></li>
                                <li><button data-action="logout"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
                            </div>
                        </ul>
                    </nav>
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
                this.user = getUser();
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
            this.user = getUser();
            if (this.user) {
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

        // Add to Cart
        document.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
            if (addToCartBtn) {
                e.preventDefault();
                const productId = addToCartBtn.dataset.productId;
                const quantity = parseInt(addToCartBtn.dataset.quantity) || 1;
                this.handleAddToCart(productId, quantity);
            }
        });

        // Wishlist Toggle
        document.addEventListener('click', (e) => {
            const wishlistBtn = e.target.closest('[data-action="wishlist-toggle"]');
            if (wishlistBtn) {
                e.preventDefault();
                const productId = wishlistBtn.dataset.productId;
                this.handleWishlistToggle(productId);
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

        // Scroll for header shadow
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
        });

        // Social login click
        document.addEventListener('click', (e) => {
            const socialBtn = e.target.closest('[data-provider]');
            if (socialBtn) {
                e.preventDefault();
                const provider = socialBtn.dataset.provider;
                this.handleSocialLogin(provider);
            }
        });
    }

    /**
     * Handle social login
     */
    handleSocialLogin(provider) {
        try {
            const btn = document.querySelector(`[data-provider="${provider}"]`);
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting...`;
            }
            
            if (provider === 'google') {
                AuthService.googleLogin();
            } else if (provider === 'facebook') {
                AuthService.facebookLogin();
            } else if (provider === 'github') {
                AuthService.githubLogin();
            }
        } catch (error) {
            console.error('Social login error:', error);
            showNotification(`Failed to connect to ${provider}. Please try again.`, 'error');
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        await AuthService.logout();
        this.user = null;
        this.navigateTo('login');
    }

    /**
     * Handle Add to Cart
     */
    async handleAddToCart(productId, quantity = 1) {
        try {
            const result = await cartService.addItem(productId, quantity);
            if (result.success) {
                showNotification('Product added to cart! 🛒', 'success');
                this.updateBadges();
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            showNotification('Failed to add to cart. Please try again.', 'error');
        }
    }

    /**
     * Handle Wishlist Toggle
     */
    async handleWishlistToggle(productId) {
        try {
            const result = await wishlistService.toggleItem(productId);
            if (result.success) {
                // Update all wishlist buttons for this product
                document.querySelectorAll(`[data-product-id="${productId}"]`).forEach(btn => {
                    btn.classList.toggle('active');
                });
                showNotification(result.inWishlist ? 'Added to wishlist! ❤️' : 'Removed from wishlist! 💔', 'success');
                this.updateBadges();
            }
        } catch (error) {
            console.error('Wishlist toggle error:', error);
            showNotification('Failed to update wishlist.', 'error');
        }
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
     * Update header based on auth state
     */
    updateHeader() {
        const isAuth = isAuthenticated();
        const user = getUser();
        const showAdmin = isAdmin();

        // Desktop menu
        const guestMenu = document.getElementById('guestMenu');
        const userMenu = document.getElementById('userMenu');
        const adminLink = document.getElementById('adminLink');

        // Mobile menu
        const mobileGuestMenu = document.getElementById('mobileGuestMenu');
        const mobileUserMenu = document.getElementById('mobileUserMenu');
        const mobileAdminLink = document.getElementById('mobileAdminLink');

        if (isAuth) {
            // Desktop
            if (guestMenu) guestMenu.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (adminLink) adminLink.style.display = showAdmin ? 'block' : 'none';
            
            // Mobile
            if (mobileGuestMenu) mobileGuestMenu.style.display = 'none';
            if (mobileUserMenu) mobileUserMenu.style.display = 'block';
            if (mobileAdminLink) mobileAdminLink.style.display = showAdmin ? 'block' : 'none';
            
            // Update user info
            if (user) {
                const nameEl = document.getElementById('userName');
                const emailEl = document.getElementById('userEmail');
                if (nameEl) nameEl.textContent = user.name || 'User';
                if (emailEl) emailEl.textContent = user.email || '';
            }
        } else {
            // Desktop
            if (guestMenu) guestMenu.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            
            // Mobile
            if (mobileGuestMenu) mobileGuestMenu.style.display = 'block';
            if (mobileUserMenu) mobileUserMenu.style.display = 'none';
        }

        // Update other auth-dependent elements
        document.querySelectorAll('[data-auth]').forEach((el) => {
            const showAuth = el.dataset.auth === 'true';
            el.style.display = showAuth === isAuth ? '' : 'none';
        });
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
        let page = path.replace(/^\//, '').split('/')[0] || 'home';
        
        // Check route aliases
        if (this.routeAliases[page]) {
            page = this.routeAliases[page];
        }
        
        return page;
    }

    /**
     * Navigate to page
     */
    navigateTo(page, params = {}) {
        // Handle aliases
        const aliasKeys = Object.keys(this.routeAliases);
        const aliasEntry = aliasKeys.find(key => this.routeAliases[key] === page);
        const urlPath = aliasEntry || page;
        
        this.currentPage = page;
        const url = page === 'home' ? '/' : `/${urlPath}`;
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

        // Show loading
        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading ${this.getPageTitle(page)}...</p>
            </div>
        `;

        try {
            // Check if page requires authentication
            const protectedPages = ['profile', 'orders', 'wishlist', 'checkout'];
            if (protectedPages.includes(page) && !isAuthenticated()) {
                showNotification('Please login to access this page', 'warning');
                this.navigateTo('login');
                return;
            }

            // Check if page requires admin access
            const adminPages = ['admin'];
            if (adminPages.includes(page) && !isAdmin()) {
                showNotification('Admin access required', 'error');
                this.navigateTo('home');
                return;
            }

            // Get the page handler
            const handler = this.pageHandlers[page];
            if (handler) {
                await handler(container);
            } else {
                await this.renderNotFound(container);
            }
        } catch (error) {
            console.error('Page render error:', error);
            container.innerHTML = `
                <div class="error-page text-center" style="padding:60px 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size:48px;color:var(--danger);"></i>
                    <h2 style="margin-top:20px;">Something went wrong</h2>
                    <p class="text-muted">${error.message || 'An unexpected error occurred'}</p>
                    <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;">
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                        <a href="/" class="btn btn-outline" data-page="home">
                            <i class="fas fa-home"></i> Go Home
                        </a>
                    </div>
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
            product: 'Product Details',
            cart: 'Shopping Cart',
            checkout: 'Checkout',
            orders: 'My Orders',
            wishlist: 'Wishlist',
            profile: 'My Profile',
            admin: 'Admin Dashboard',
            login: 'Login',
            register: 'Register',
            'forgot-password': 'Forgot Password',
            'reset-password': 'Reset Password',
            'social-login': 'Social Login'
        };
        document.title = `${titles[page] || 'E-Shop'} | E-Shop`;
    }

    /**
     * Update active nav
     */
    updateActiveNav(page) {
        document.querySelectorAll('[data-page]').forEach(el => {
            const linkPage = el.dataset.page;
            const isActive = linkPage === page || 
                           (page === 'home' && linkPage === 'home') ||
                           (page === 'product' && linkPage === 'products');
            el.classList.toggle('active', isActive);
        });
    }

    /**
     * Render not found
     */
    renderNotFound(container) {
        container.innerHTML = `
            <div class="error-page text-center" style="padding:80px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size:64px;color:var(--gray-400);"></i>
                <h1 style="font-size:72px;margin:20px 0;">404</h1>
                <h2>Page Not Found</h2>
                <p class="text-muted">The page you're looking for doesn't exist or has been moved.</p>
                <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;">
                    <a href="/" class="btn btn-primary" data-page="home">
                        <i class="fas fa-home"></i> Go Home
                    </a>
                    <a href="/products" class="btn btn-outline" data-page="products">
                        <i class="fas fa-box"></i> Browse Products
                    </a>
                </div>
            </div>
        `;
    }

    // ============================================
    // PAGE TITLE HELPER
    // ============================================

    getPageTitle(page) {
        const titles = {
            home: 'Home',
            products: 'Products',
            product: 'Product Details',
            cart: 'Shopping Cart',
            checkout: 'Checkout',
            orders: 'My Orders',
            wishlist: 'Wishlist',
            profile: 'My Profile',
            admin: 'Admin Dashboard',
            login: 'Login',
            register: 'Register',
            'forgot-password': 'Forgot Password',
            'reset-password': 'Reset Password',
            'social-login': 'Social Login'
        };
        return titles[page] || 'E-Shop';
    }

    // ============================================
    // AUTH PAGE RENDERERS
    // ============================================

    async renderLoginPage(container) {
        const page = new LoginPage({
            app: this,
            onLogin: async (user) => {
                this.user = user;
                await this.loadUserData();
                this.updateUI();
                showNotification(`Welcome back, ${user.name}! 👋`, 'success');
            }
        });
        page.mount(container);
    }

    async renderRegisterPage(container) {
        const page = new RegisterPage({
            app: this,
            onRegister: async (user) => {
                this.user = user;
                await this.loadUserData();
                this.updateUI();
                showNotification(`Welcome to E-Shop, ${user.name}! 🎉`, 'success');
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

    async renderSocialLoginPage(container) {
        const page = new SocialLoginPage({ app: this });
        await page.mount(container);
    }

    // ============================================
    // MAIN PAGE RENDERERS
    // ============================================

    /**
     * Render Home Page
     */
    async renderHome(container) {
        try {
            const products = await productService.getFeatured(8);
            const categories = await productService.getCategories();
            
            container.innerHTML = `
                <div class="home-page fade-in">
                    <section class="hero-section">
                        <div class="hero-content">
                            <h1>Welcome to E-Shop</h1>
                            <p>Discover amazing products at unbeatable prices. Shop the latest trends today!</p>
                            <a href="/products" class="btn btn-primary btn-lg" data-page="products">
                                <i class="fas fa-shopping-bag"></i> Start Shopping
                            </a>
                        </div>
                    </section>

                    <section class="categories-section">
                        <h2>Shop by Category</h2>
                        <div class="categories-grid">
                            ${categories && categories.length > 0 
                                ? categories.slice(0, 8).map(cat => `
                                    <div class="category-item" data-category="${cat.id}">
                                        <div class="category-icon">${cat.iconUrl || '📦'}</div>
                                        <div class="category-name">${cat.name}</div>
                                    </div>
                                `).join('')
                                : '<p class="text-muted">No categories available</p>'
                            }
                        </div>
                    </section>

                    <section class="products-section">
                        <div class="section-header">
                            <h2>Featured Products</h2>
                            <a href="/products" class="btn btn-outline" data-page="products">
                                View All <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                        <div class="products-grid" id="featuredProducts">
                            ${products && products.length > 0
                                ? products.map(p => this.renderProductCard(p)).join('')
                                : '<p class="text-muted">No featured products available</p>'
                            }
                        </div>
                    </section>
                </div>
            `;

            // Category click handlers
            container.querySelectorAll('.category-item').forEach(el => {
                el.addEventListener('click', () => {
                    const categoryId = el.dataset.category;
                    this.navigateTo('products', { category: categoryId });
                });
            });

        } catch (error) {
            console.error('Error loading home page:', error);
            container.innerHTML = `
                <div class="error-page">
                    <h2>Error Loading Products</h2>
                    <p>${error.message || 'Something went wrong'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    /**
     * Render Products Page
     */
    async renderProducts(container) {
        try {
            const result = await productService.loadProducts();
            const products = result?.products || [];

            container.innerHTML = `
                <div class="products-page fade-in">
                    <div class="section-header">
                        <h1>All Products</h1>
                        <div class="filters">
                            <select id="sortProducts" class="form-control">
                                <option value="createdAt:desc">Newest</option>
                                <option value="price:asc">Price: Low to High</option>
                                <option value="price:desc">Price: High to Low</option>
                                <option value="salesCount:desc">Best Selling</option>
                                <option value="averageRating:desc">Highest Rated</option>
                            </select>
                        </div>
                    </div>
                    <div class="products-grid" id="productsGrid">
                        ${products && products.length > 0
                            ? products.map(p => this.renderProductCard(p)).join('')
                            : `
                                <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:60px 0;">
                                    <i class="fas fa-box-open" style="font-size:48px;color:var(--gray-400);"></i>
                                    <h3>No products found</h3>
                                    <p class="text-muted">Try adjusting your filters or search terms</p>
                                    <a href="/products" class="btn btn-primary" data-page="products">Clear Filters</a>
                                </div>
                            `
                        }
                    </div>
                </div>
            `;

            // Sort handler
            const sortSelect = container.querySelector('#sortProducts');
            if (sortSelect) {
                sortSelect.addEventListener('change', () => {
                    const [sortBy, sortOrder] = sortSelect.value.split(':');
                    productService.setFilter('sortBy', sortBy);
                    productService.setFilter('sortOrder', sortOrder);
                    this.renderProducts(container);
                });
            }

        } catch (error) {
            console.error('Error loading products:', error);
            container.innerHTML = `
                <div class="error-page">
                    <h2>Error Loading Products</h2>
                    <p>${error.message || 'Something went wrong'}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    /**
     * Render Product Card
     */
    renderProductCard(product) {
        const price = formatCurrency(product.price);
        const comparePrice = product.comparePrice ? formatCurrency(product.comparePrice) : null;
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        const image = product.images?.[0]?.imageUrl || '/placeholder.jpg';
        const inStock = product.stockQuantity > 0;
        const rating = product.averageRating || 0;
        const reviewCount = product.totalReviews || 0;
        const inWishlist = wishlistService.isInWishlist(product.id);

        let badges = '';
        if (discount > 0) badges += `<span class="badge badge-sale">-${discount}%</span>`;
        if (product.isFeatured) badges += `<span class="badge badge-featured">Featured</span>`;
        if (!inStock) badges += `<span class="badge badge-sold-out">Sold Out</span>`;

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${image}" alt="${product.name}" loading="lazy" onerror="this.src='/placeholder.jpg'" />
                    ${badges ? `<div class="product-badges">${badges}</div>` : ''}
                    <button class="wishlist-btn ${inWishlist ? 'active' : ''}" 
                            data-action="wishlist-toggle" 
                            data-product-id="${product.id}"
                            aria-label="Add to wishlist">
                        <i class="fa${inWishlist ? 's' : 'r'} fa-heart"></i>
                    </button>
                </div>
                <div class="product-body">
                    <div class="product-rating">
                        <div class="stars">${this.renderStars(rating)}</div>
                        <span class="rating-count">(${reviewCount})</span>
                    </div>
                    <div class="product-name">
                        <a href="/product/${product.id}" data-page="product" data-product-id="${product.id}">
                            ${product.name}
                        </a>
                    </div>
                    <div class="product-price">
                        <span class="current">${price}</span>
                        ${comparePrice ? `<span class="original">${comparePrice}</span>` : ''}
                        ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
                    </div>
                    <div class="product-stock ${inStock ? 'in-stock' : 'out-of-stock'}">
                        ${inStock ? '✓ In Stock' : '✕ Out of Stock'}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-add-cart" 
                                data-action="add-to-cart" 
                                data-product-id="${product.id}"
                                ${!inStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${inStock ? 'Add to Cart' : 'Sold Out'}
                        </button>
                        <button class="btn btn-outline btn-wishlist ${inWishlist ? 'active' : ''}" 
                                data-action="wishlist-toggle" 
                                data-product-id="${product.id}"
                                aria-label="Add to wishlist">
                            <i class="fa${inWishlist ? 's' : 'r'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Stars
     */
    renderStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < full; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (half) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < empty; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    }

    /**
     * Render Product Detail (Placeholder)
     */
    async renderProductDetail(container) {
        container.innerHTML = `
            <div class="product-detail-page fade-in">
                <h1>Product Details</h1>
                <p class="text-muted">Loading product...</p>
            </div>
        `;
    }

    /**
     * Render Cart Page (Placeholder)
     */
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

    /**
     * Render Checkout Page (Placeholder)
     */
    async renderCheckout(container) {
        container.innerHTML = `
            <div class="checkout-page fade-in">
                <h1>Checkout</h1>
                <p class="text-muted">Loading checkout...</p>
            </div>
        `;
    }

    /**
     * Render Orders Page (Placeholder)
     */
    async renderOrders(container) {
        container.innerHTML = `
            <div class="orders-page fade-in">
                <h1>My Orders</h1>
                <p class="text-muted">Loading orders...</p>
            </div>
        `;
    }

    /**
     * Render Wishlist Page (Placeholder)
     */
    async renderWishlist(container) {
        container.innerHTML = `
            <div class="wishlist-page fade-in">
                <h1>My Wishlist</h1>
                <p class="text-muted">Loading wishlist...</p>
            </div>
        `;
    }

    /**
     * Render Profile Page (Placeholder)
     */
    async renderProfile(container) {
        container.innerHTML = `
            <div class="profile-page fade-in">
                <h1>My Profile</h1>
                <p class="text-muted">Loading profile...</p>
            </div>
        `;
    }

    /**
     * Render Admin Page (Placeholder)
     */
    async renderAdmin(container) {
        container.innerHTML = `
            <div class="admin-page fade-in">
                <h1>Admin Dashboard</h1>
                <p class="text-muted">Loading admin dashboard...</p>
            </div>
        `;
    }

    // ============================================
    // LISTENER METHODS
    // ============================================

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

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