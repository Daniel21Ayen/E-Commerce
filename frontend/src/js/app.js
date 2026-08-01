// frontend/src/js/app.js - Update imports and page handlers

// Import auth pages

import LoginPage from './pages/auth/LoginPage.js';
import RegisterPage from './pages/auth/RegisterPage.js';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.js';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.js';

// In the constructor, update page handlers
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
  // Auth pages
  login: this.renderLoginPage.bind(this),
  register: this.renderRegisterPage.bind(this),
  'forgot-password': this.renderForgotPasswordPage.bind(this),
  'reset-password': this.renderResetPasswordPage.bind(this)
};

// Auth page renderers
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