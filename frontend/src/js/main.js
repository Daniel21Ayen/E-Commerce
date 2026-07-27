/**
 * Main Entry Point
 * Bootstraps the application
 */

import './../css/styles.css';
import './../css/auth.css';
import './../css/products.css';
import './../css/cart.css';
import './../css/admin.css';
import './../css/responsive.css';
import './../css/dark-mode.css';

import app from './app';
import AuthService from './modules/auth';
import cartService from './modules/cart';
import productService from './modules/products';
import wishlistService from './modules/wishlist';
import reviewService from './modules/reviews';
import orderService from './modules/orders';
import searchService from './modules/search';
import adminService from './modules/admin';
import i18n from './modules/i18n';

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
  admin: adminService,
  i18n
};

// Handle service worker registration (for PWA)
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
  // Refresh data
  app.init();
});

window.addEventListener('offline', () => {
  console.log('Offline');
  // Show offline notification
  import('./utils').then(({ showNotification }) => {
    showNotification('You are offline. Some features may not work.', 'warning');
  });
});

// Handle dark mode preference
const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMedia.addEventListener('change', (e) => {
  document.documentElement.classList.toggle('dark-mode', e.matches);
});

if (darkModeMedia.matches) {
  document.documentElement.classList.add('dark-mode');
}

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Report web vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}

console.log(`🚀 E-Commerce App v${process.env.VERSION || '1.0.0'}`);
console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 Language: ${i18n.language}`);

// Export main app
export default app;