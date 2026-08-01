// frontend/src/js/main.js

// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import CSS
import './../css/styles.css';
import './../css/auth.css';
import './../css/products.css';
import './../css/cart.css';
import './../css/admin.css';
import './../css/responsive.css';
import './../css/dark-mode.css';

// Import app and modules
import app from './app.js';
import AuthService, { isAuthenticated, isAdmin, getUser } from './modules/auth.js';
import cartService from './modules/cart.js';
import productService from './modules/products.js';
import wishlistService from './modules/wishlist.js';
import reviewService from './modules/reviews.js';
import orderService from './modules/orders.js';
import searchService from './modules/search.js';
import adminService from './modules/admin.js';
import { showNotification } from './modules/utils.js';

// Export services for global use
window.__APP = {
    app,
    auth: AuthService,
    cart: cartService,
    products: productService,
    wishlist: wishlistService,
    reviews: reviewService,
    orders: orderService,
    search: searchService,
    admin: adminService
};

// Handle service worker registration
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}

// Handle offline detection
window.addEventListener('online', () => {
    console.log('Back online');
    app.init();
});

window.addEventListener('offline', () => {
    console.log('Offline');
    showNotification('You are offline. Some features may not work.', 'warning');
});

// Handle dark mode preference
const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMedia.addEventListener('change', (e) => {
    document.documentElement.classList.toggle('dark-mode', e.matches);
});

if (darkModeMedia.matches) {
    document.documentElement.classList.add('dark-mode');
}

console.log(`🚀 E-Commerce App v${process.env.VERSION || '1.0.0'}`);
console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

export default app;