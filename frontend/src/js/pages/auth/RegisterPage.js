// frontend/src/js/pages/auth/RegisterPage.js

import BaseAuthPage from './BaseAuthPage';
import { showNotification } from '../../modules/utils';
import AuthService from '../../modules/auth';

export default class RegisterPage extends BaseAuthPage {
  constructor(props) {
    super(props);
    this.title = 'Register';
    this.description = 'Create your account to start shopping';
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
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" name="terms" required />
                I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
              </label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="registerBtn">
              <i class="fas fa-user-plus"></i> Create Account
            </button>
          </form>
          
          <div class="auth-divider"><span>or continue with</span></div>
          
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
          
          <div class="auth-footer">
            Already have an account? <a href="/login" data-page="login">Sign In</a>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const form = this.element.querySelector('#registerForm');
    if (form) {
      this.addListener(form, 'submit', async (e) => {
        e.preventDefault();
        await this.handleRegister(form);
      });
    }

    // Password strength indicator (optional)
    const passwordInput = this.element.querySelector('input[name="password"]');
    if (passwordInput) {
      this.addListener(passwordInput, 'input', () => {
        this.updatePasswordStrength(passwordInput.value);
      });
    }

    // Social login buttons
    this.element.querySelectorAll('.btn-social').forEach(btn => {
      this.addListener(btn, 'click', () => {
        const provider = btn.dataset.provider;
        this.handleSocialLogin(provider);
      });
    });
  }

  async handleRegister(form) {
    this.clearFormErrors(form);
    
    const data = this.getFormData(form);
    const { name, email, password, confirmPassword, phone, terms } = data;

    // Validate
    let hasError = false;

    if (!name || name.length < 2) {
      this.showFieldError(form, 'name', 'Name must be at least 2 characters');
      hasError = true;
    }

    if (!email) {
      this.showFieldError(form, 'email', 'Email is required');
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
        showNotification('Registration successful! Welcome!', 'success');
        this.navigate('home');
        if (this.props.onRegister) {
          await this.props.onRegister(result.user);
        }
      } else {
        // Show specific error
        if (result.error.includes('already registered')) {
          this.showFieldError(form, 'email', 'Email already registered. Please login.');
        } else {
          this.showFieldError(form, 'email', result.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('Registration failed. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  updatePasswordStrength(password) {
    const strength = this.getPasswordStrength(password);
    // You can add visual feedback here
  }

  getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    return score;
  }

  async handleSocialLogin(provider) {
    showNotification(`Connecting to ${provider}...`, 'info');
    // Implement social login logic
  }
}