// frontend/src/js/pages/auth/BaseAuthPage.js

import BasePage from '../BasePage';
import { isAuthenticated } from '../../modules/auth';

export default class BaseAuthPage extends BasePage {
  constructor(props) {
    super(props);
    this.redirectIfAuthenticated = props.redirectIfAuthenticated !== false;
  }

  async mount(container) {
    // Redirect if already authenticated
    if (this.redirectIfAuthenticated && isAuthenticated()) {
      this.navigate('home');
      return;
    }
    super.mount(container);
  }

  /**
   * Show form error
   */
  showFieldError(form, fieldName, message) {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.classList.add('is-invalid');
      const existingError = field.parentElement.querySelector('.form-error');
      if (existingError) {
        existingError.remove();
      }
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
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  }
}