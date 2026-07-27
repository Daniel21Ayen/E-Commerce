/**
 * i18n Module - Handles internationalization and translations
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      'app.name': 'E-Commerce',
      'app.tagline': 'Your One-Stop Shop',
      
      // Navigation
      'nav.home': 'Home',
      'nav.products': 'Products',
      'nav.cart': 'Cart',
      'nav.wishlist': 'Wishlist',
      'nav.orders': 'Orders',
      'nav.profile': 'Profile',
      'nav.admin': 'Admin Dashboard',
      'nav.login': 'Login',
      'nav.register': 'Register',
      'nav.logout': 'Logout',
      'nav.search': 'Search...',
      
      // Auth
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.name': 'Full Name',
      'auth.phone': 'Phone Number',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.resetPassword': 'Reset Password',
      'auth.loginSuccess': 'Login successful!',
      'auth.registerSuccess': 'Registration successful!',
      'auth.loginError': 'Login failed. Please try again.',
      'auth.registerError': 'Registration failed. Please try again.',
      'auth.passwordChanged': 'Password changed successfully!',
      'auth.passwordChangeError': 'Failed to change password.',
      'auth.resetEmailSent': 'Password reset email sent!',
      'auth.resetEmailError': 'Failed to send reset email.',
      'auth.passwordReset': 'Password reset successfully!',
      'auth.passwordResetError': 'Failed to reset password.',
      'auth.emailVerified': 'Email verified successfully!',
      'auth.emailVerifyError': 'Failed to verify email.',
      'auth.profileUpdated': 'Profile updated successfully!',
      'auth.profileUpdateError': 'Failed to update profile.',
      
      // Products
      'products.title': 'Products',
      'products.loadError': 'Failed to load products.',
      'products.inStock': 'In Stock',
      'products.lowStock': 'Low Stock',
      'products.outOfStock': 'Out of Stock',
      'products.addToCart': 'Add to Cart',
      'products.viewDetails': 'View Details',
      'products.noProducts': 'No products found',
      'products.searchResults': 'Search Results',
      'products.featured': 'Featured Products',
      'products.related': 'Related Products',
      'products.reviews': 'Reviews',
      'products.writeReview': 'Write a Review',
      'products.noReviews': 'No reviews yet',
      'products.soldOut': 'Sold Out',
      'products.quantity': 'Quantity',
      'products.addToWishlist': 'Add to Wishlist',
      'products.inWishlist': 'In Wishlist',
      
      // Filters
      'filters.category': 'Category',
      'filters.price': 'Price',
      'filters.minPrice': 'Min Price',
      'filters.maxPrice': 'Max Price',
      'filters.rating': 'Rating',
      'filters.inStock': 'In Stock Only',
      'filters.sortBy': 'Sort By',
      'filters.sortNewest': 'Newest',
      'filters.sortPriceLow': 'Price: Low to High',
      'filters.sortPriceHigh': 'Price: High to Low',
      'filters.sortPopular': 'Most Popular',
      'filters.sortRating': 'Highest Rated',
      'filters.apply': 'Apply Filters',
      'filters.clear': 'Clear Filters',
      'filters.showing': 'Showing',
      'filters.results': 'results',
      
      // Cart
      'cart.title': 'Shopping Cart',
      'cart.empty': 'Your cart is empty',
      'cart.subtotal': 'Subtotal',
      'cart.total': 'Total',
      'cart.discount': 'Discount',
      'cart.shipping': 'Shipping',
      'cart.tax': 'Tax',
      'cart.checkout': 'Proceed to Checkout',
      'cart.continueShopping': 'Continue Shopping',
      'cart.remove': 'Remove',
      'cart.update': 'Update',
      'cart.itemAdded': 'Item added to cart!',
      'cart.addError': 'Failed to add item to cart.',
      'cart.itemRemoved': 'Item removed from cart!',
      'cart.removeError': 'Failed to remove item from cart.',
      'cart.updateError': 'Failed to update cart.',
      'cart.cleared': 'Cart cleared!',
      'cart.clearError': 'Failed to clear cart.',
      'cart.promoApplied': 'Promo code applied!',
      'cart.promoError': 'Invalid promo code.',
      'cart.promoRemoved': 'Promo code removed!',
      
      // Wishlist
      'wishlist.title': 'My Wishlist',
      'wishlist.empty': 'Your wishlist is empty',
      'wishlist.added': 'Added to wishlist!',
      'wishlist.addError': 'Failed to add to wishlist.',
      'wishlist.removed': 'Removed from wishlist!',
      'wishlist.removeError': 'Failed to remove from wishlist.',
      'wishlist.movedToCart': 'Moved to cart!',
      'wishlist.moveError': 'Failed to move to cart.',
      'wishlist.movedAll': 'Moved {count} items to cart!',
      'wishlist.moveAllError': 'Failed to move some items to cart.',
      'wishlist.cleared': 'Wishlist cleared!',
      'wishlist.clearError': 'Failed to clear wishlist.',
      'wishlist.moveAll': 'Move All to Cart',
      
      // Orders
      'orders.title': 'My Orders',
      'orders.empty': 'No orders yet',
      'orders.orderNumber': 'Order #{number}',
      'orders.date': 'Date',
      'orders.total': 'Total',
      'orders.status': 'Status',
      'orders.view': 'View Order',
      'orders.cancel': 'Cancel Order',
      'orders.track': 'Track Order',
      'orders.invoice': 'Download Invoice',
      'orders.created': 'Order created successfully!',
      'orders.createError': 'Failed to create order.',
      'orders.cancelled': 'Order cancelled!',
      'orders.cancelError': 'Failed to cancel order.',
      'orders.trackError': 'Failed to track order.',
      'orders.invoiceError': 'Failed to generate invoice.',
      'orders.loadError': 'Failed to load orders.',
      
      'orders.status.pending': 'Pending',
      'orders.status.processing': 'Processing',
      'orders.status.shipped': 'Shipped',
      'orders.status.delivered': 'Delivered',
      'orders.status.cancelled': 'Cancelled',
      'orders.status.refunded': 'Refunded',
      'orders.status.failed': 'Failed',
      
      'orders.payment.pending': 'Pending',
      'orders.payment.paid': 'Paid',
      'orders.payment.failed': 'Failed',
      'orders.payment.refunded': 'Refunded',
      'orders.payment.partiallyRefunded': 'Partially Refunded',
      
      'orders.timeline.orderPlaced': 'Order Placed',
      'orders.timeline.paymentConfirmed': 'Payment Confirmed',
      'orders.timeline.processing': 'Processing',
      'orders.timeline.shipped': 'Shipped',
      'orders.timeline.delivered': 'Delivered',
      'orders.timeline.cancelled': 'Cancelled',
      
      // Checkout
      'checkout.title': 'Checkout',
      'checkout.shippingAddress': 'Shipping Address',
      'checkout.billingAddress': 'Billing Address',
      'checkout.paymentMethod': 'Payment Method',
      'checkout.creditCard': 'Credit Card',
      'checkout.debitCard': 'Debit Card',
      'checkout.paypal': 'PayPal',
      'checkout.bankTransfer': 'Bank Transfer',
      'checkout.cashOnDelivery': 'Cash on Delivery',
      'checkout.reviewOrder': 'Review Order',
      'checkout.placeOrder': 'Place Order',
      'checkout.orderSuccess': 'Order placed successfully!',
      'checkout.orderError': 'Failed to place order.',
      
      // Admin
      'admin.dashboard': 'Dashboard',
      'admin.products': 'Products',
      'admin.orders': 'Orders',
      'admin.inventory': 'Inventory',
      'admin.customers': 'Customers',
      'admin.analytics': 'Analytics',
      'admin.sales': 'Sales',
      'admin.revenue': 'Revenue',
      'admin.totalOrders': 'Total Orders',
      'admin.totalProducts': 'Total Products',
      'admin.totalCustomers': 'Total Customers',
      'admin.lowStock': 'Low Stock Items',
      'admin.export': 'Export',
      'admin.import': 'Import',
      
      // Reviews
      'reviews.title': 'Reviews',
      'reviews.write': 'Write a Review',
      'reviews.rating': 'Rating',
      'reviews.titleLabel': 'Review Title',
      'reviews.description': 'Review Description',
      'reviews.submit': 'Submit Review',
      'reviews.created': 'Review submitted!',
      'reviews.createError': 'Failed to submit review.',
      'reviews.updated': 'Review updated!',
      'reviews.updateError': 'Failed to update review.',
      'reviews.deleted': 'Review deleted!',
      'reviews.deleteError': 'Failed to delete review.',
      'reviews.likeError': 'Failed to like review.',
      'reviews.unlikeError': 'Failed to unlike review.',
      'reviews.helpful': 'Helpful',
      'reviews.notHelpful': 'Not Helpful',
      'reviews.verifiedPurchase': 'Verified Purchase',
      
      // Errors
      'error.required': '{field} is required',
      'error.minLength': '{field} must be at least {min} characters',
      'error.maxLength': '{field} must not exceed {max} characters',
      'error.email': 'Please enter a valid email address',
      'error.password': 'Password must be at least 8 characters with uppercase, lowercase, and number',
      'error.passwordsMatch': 'Passwords do not match',
      'error.phone': 'Please enter a valid phone number',
      'error.number': 'Please enter a valid number',
      'error.min': '{field} must be at least {min}',
      'error.max': '{field} must not exceed {max}',
      'error.url': 'Please enter a valid URL',
      
      // General
      'general.loading': 'Loading...',
      'general.error': 'An error occurred',
      'general.success': 'Success!',
      'general.save': 'Save',
      'general.cancel': 'Cancel',
      'general.delete': 'Delete',
      'general.edit': 'Edit',
      'general.view': 'View',
      'general.close': 'Close',
      'general.back': 'Back',
      'general.next': 'Next',
      'general.confirm': 'Confirm',
      'general.submit': 'Submit',
      'general.search': 'Search',
      'general.filter': 'Filter',
      'general.sort': 'Sort',
      'general.loadMore': 'Load More',
      'general.showMore': 'Show More',
      'general.showLess': 'Show Less',
      'general.select': 'Select',
      'general.optional': 'Optional',
      'general.required': 'Required',
      'general.currency': '$'
    }
  },
  es: {
    translation: {
      // Spanish translations would go here
      'app.name': 'Comercio Electrónico',
      'nav.home': 'Inicio',
      'nav.products': 'Productos',
      // ... more translations
    }
  },
  fr: {
    translation: {
      // French translations would go here
      'app.name': 'Commerce Électronique',
      'nav.home': 'Accueil',
      'nav.products': 'Produits',
      // ... more translations
    }
  }
};

// Initialize i18n
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng'
    },
    react: {
      useSuspense: false
    }
  });

// Translation helper
export const t = (key, options = {}) => {
  return i18n.t(key, options);
};

// Change language
export const changeLanguage = (lng) => {
  return i18n.changeLanguage(lng);
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Get available languages
export const getLanguages = () => {
  return Object.keys(i18n.services.resourceStore.data);
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency
  }).format(amount);
};

// Format date
export const formatDate = (date, options = {}) => {
  return new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(new Date(date));
};

// Format number
export const formatNumber = (number, options = {}) => {
  return new Intl.NumberFormat(i18n.language, options).format(number);
};

export default i18n;