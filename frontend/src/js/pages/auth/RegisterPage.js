// frontend/src/js/pages/auth/RegisterPage.js

import BaseAuthPage from './BaseAuthPage.js';
import { showNotification } from '../../modules/utils.js';
import AuthService from '../../modules/auth.js';

export default class RegisterPage extends BaseAuthPage {
  constructor(props) {
    super(props);
    this.title = 'Register';
    this.description = 'Create your account to start shopping';
    this.app = props?.app || null;
    this.onRegister = props?.onRegister || null;
  }

  template() {
    return `
      <div class="auth-container fade-in">
        <div class="auth-card register-card">
          <div class="auth-header">
            <span class="auth-logo">🛍️</span>
            <h2>Create Account</h2>
            <p>Join us and start shopping today</p>
          </div>
          
          <form id="registerForm" data-action="register" novalidate>
            <!-- Name -->
            <div class="form-group">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-control" 
                name="name" 
                placeholder="Enter your full name" 
                required 
                autocomplete="name"
                autofocus
              />
            </div>
            
            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email Address <span class="required">*</span></label>
              <input 
                type="email" 
                class="form-control" 
                name="email" 
                placeholder="Enter your email" 
                required 
                autocomplete="email"
              />
            </div>
            
            <!-- Phone (Optional) -->
            <div class="form-group">
              <label class="form-label">Phone (optional)</label>
              <input 
                type="tel" 
                class="form-control" 
                name="phone" 
                placeholder="Enter your phone number" 
                autocomplete="tel"
              />
            </div>
            
            <!-- Password -->
            <div class="form-group">
              <label class="form-label">Password <span class="required">*</span></label>
              <input 
                type="password" 
                class="form-control" 
                name="password" 
                placeholder="Create a password (min 8 chars)" 
                required 
                minlength="8"
                autocomplete="new-password"
              />
              <div class="password-hint">
                <small>Must contain at least 8 characters with uppercase, lowercase, and number</small>
              </div>
            </div>
            
            <!-- Confirm Password -->
            <div class="form-group">
              <label class="form-label">Confirm Password <span class="required">*</span></label>
              <input 
                type="password" 
                class="form-control" 
                name="confirmPassword" 
                placeholder="Confirm your password" 
                required
                autocomplete="new-password"
              />
            </div>
            
            <!-- Terms -->
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" name="terms" required />
                I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
              </label>
            </div>
            
            <!-- Submit Button -->
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="registerBtn">
              <i class="fas fa-user-plus"></i> Create Account
            </button>
          </form>
          
          <!-- Divider -->
          <div class="auth-divider"><span>or continue with</span></div>
          
          <!-- Social Login -->
          <div class="social-login">
            <button class="btn-social google" data-provider="google">
              <i class="fab fa-google"></i> Google
            </button>
            <button class="btn-social facebook" data-provider="facebook">
              <i class="fab fa-facebook-f"></i> Facebook
            </button>
            <button class="btn-social github" data-provider="github">
              <i class="fab fa-github"></i> GitHub
            </button>
          </div>
          
          <!-- Footer -->
          <div class="auth-footer">
            Already have an account? <a href="/login" data-page="login">Sign In</a>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const form = this.element?.querySelector('#registerForm');
    if (form) {
      this.addListener(form, 'submit', async (e) => {
        e.preventDefault();
        await this.handleRegister(form);
      });
    }

    // Social login buttons
    this.element?.querySelectorAll('.btn-social').forEach(btn => {
      this.addListener(btn, 'click', () => {
        const provider = btn.dataset.provider;
        this.handleSocialLogin(provider);
      });
    });

    // Login link
    const loginLink = this.element?.querySelector('[data-page="login"]');
    if (loginLink) {
      this.addListener(loginLink, 'click', (e) => {
        e.preventDefault();
        this.navigate('login');
      });
    }
  }

  async handleRegister(form) {
    // Clear previous errors
    this.clearFormErrors(form);
    
    // Get form data
    const data = this.getFormData(form);
    const { name, email, password, confirmPassword, phone, terms } = data;

    // Validation
    let hasError = false;

    if (!name || name.length < 2) {
      this.showFieldError(form, 'name', 'Name must be at least 2 characters');
      hasError = true;
    }

    if (!email) {
      this.showFieldError(form, 'email', 'Email is required');
      hasError = true;
    } else if (!this.isValidEmail(email)) {
      this.showFieldError(form, 'email', 'Please enter a valid email address');
      hasError = true;
    }

    if (!password || password.length < 8) {
      this.showFieldError(form, 'password', 'Password must be at least 8 characters');
      hasError = true;
    }

    if (password !== confirmPassword) {
      this.showFieldError(form, 'confirmPassword', 'Passwords do not match');
      hasError = true;
    }

    if (!terms) {
      showNotification('Please agree to the Terms of Service', 'warning');
      hasError = true;
    }

    if (hasError) return;

    // Show loading state
    const submitBtn = form.querySelector('#registerBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    try {
      const result = await AuthService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        phone: phone || null
      });

      if (result.success) {
        // Show success message
        showNotification('Registration successful! Please login.', 'success');
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          this.navigate('login');
        }, 1500);
        
        // Clear the form
        form.reset();
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        return;
      } else {
        // Handle specific error types
        const errorMsg = result.error || 'Registration failed';
        
        if (errorMsg.toLowerCase().includes('already registered')) {
          this.showFieldError(form, 'email', 'Email already registered. Please login.');
        } else if (errorMsg.toLowerCase().includes('password')) {
          this.showFieldError(form, 'password', errorMsg);
        } else {
          this.showFieldError(form, 'email', errorMsg);
          showNotification(errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle network errors
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        showNotification('Network error. Please check your connection.', 'error');
      } else if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Registration failed';
        
        if (status === 400) {
          // Validation errors
          const errors = error.response.data?.errors;
          if (errors && Array.isArray(errors)) {
            const firstError = errors[0];
            this.showFieldError(form, firstError.field || 'email', firstError.message);
          } else {
            showNotification(message, 'error');
          }
        } else if (status === 409) {
          this.showFieldError(form, 'email', 'Email already registered. Please login.');
        } else {
          showNotification(message, 'error');
        }
      } else {
        showNotification('Registration failed. Please try again.', 'error');
      }
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return emailRegex.test(email);
  }

  /**
   * Show field error
   */
  showFieldError(form, fieldName, message) {
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
    form.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });
    form.querySelectorAll('.form-error').forEach(el => {
      el.remove();
    });
  }

  /**
   * Get form data
   */
  getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  }

  async handleSocialLogin(provider) {
    showNotification(`Connecting to ${provider}...`, 'info');
    // Implement social login logic here
  }
}