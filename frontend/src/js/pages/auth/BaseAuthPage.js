// frontend/src/js/pages/auth/BaseAuthPage.js

import BasePage from '../BasePage.js';
import { isAuthenticated } from '../../modules/auth.js';

export default class BaseAuthPage extends BasePage {
  constructor(props = {}) {
    super(props);
    this.redirectIfAuthenticated = props.redirectIfAuthenticated !== false;
    this.app = props.app || null;
    this.onLogin = props.onLogin || null;
    this.onRegister = props.onRegister || null;
  }

  /**
   * Mount the page
   */
  mount(container) {
    // Redirect if already authenticated
    if (this.redirectIfAuthenticated && isAuthenticated()) {
      if (this.app && this.app.navigateTo) {
        this.app.navigateTo('home');
      } else {
        window.location.href = '/';
      }
      return this;
    }
    return super.mount(container);
  }

  /**
   * Show field error
   */
  showFieldError(form, fieldName, message) {
    if (!form) return;
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.classList.add('is-invalid');
      // Remove existing error
      const existingError = field.parentElement.querySelector('.form-error');
      if (existingError) {
        existingError.remove();
      }
      // Add new error
      const error = document.createElement('div');
      error.className = 'form-error';
      error.textContent = message;
      field.parentElement.appendChild(error);
    }
  }

  /**
   * Clear form errors
   */
  clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });
    form.querySelectorAll('.form-error').forEach(el => {
      el.remove();
    });
  }

  /**
   * Get form data as object
   */
  getFormData(form) {
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  }

  /**
   * Navigate to a page
   */
  navigate(page) {
    if (this.app && this.app.navigateTo) {
      this.app.navigateTo(page);
    } else {
      window.location.href = `/${page}`;
    }
  }

  /**
   * Handle social login
   */
  async handleSocialLogin(provider) {
    console.log(`Social login with ${provider}`);
  }

  /**
   * Template method - override in child
   */
  template() {
    return '';
  }
}