// frontend/src/js/pages/auth/LoginPage.js

import BaseAuthPage from './BaseAuthPage';
import { showNotification } from '../../modules/utils';
import AuthService from '../../modules/auth';

export default class LoginPage extends BaseAuthPage {
  constructor(props) {
    super(props);
    this.title = 'Login';
    this.description = 'Welcome back! Sign in to your account.';
  }

  template() {
    return `
      <div class="auth-container fade-in">
        <div class="auth-card">
          <div class="auth-header">
            <span class="auth-logo">🛍️</span>
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue shopping</p>
          </div>
          
          <form id="loginForm" data-action="login" novalidate>
            <div class="form-group">
              <label class="form-label">Email Address <span class="required">*</span></label>
              <input 
                type="email" 
                class="form-control" 
                name="email" 
                placeholder="Enter your email" 
                required 
                autocomplete="email"
                autofocus
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Password <span class="required">*</span></label>
              <input 
                type="password" 
                class="form-control" 
                name="password" 
                placeholder="Enter your password" 
                required 
                autocomplete="current-password"
              />
            </div>
            
            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" name="remember" />
                Remember me
              </label>
              <a href="/forgot-password" data-page="forgot-password" class="forgot-link">
                Forgot Password?
              </a>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">
              <i class="fas fa-sign-in-alt"></i> Sign In
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
            Don't have an account? <a href="/register" data-page="register">Sign Up</a>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const form = this.element.querySelector('#loginForm');
    if (form) {
      this.addListener(form, 'submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(form);
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

  async handleLogin(form) {
    this.clearFormErrors(form);
    
    const data = this.getFormData(form);
    const { email, password } = data;

    if (!email || !password) {
      this.showFieldError(form, email ? 'password' : 'email', 
        email ? 'Password is required' : 'Email is required');
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('#loginBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    try {
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        showNotification('Login successful! Welcome back!', 'success');
        this.navigate('home');
        // Reload user data
        if (this.props.onLogin) {
          await this.props.onLogin(result.user);
        }
      } else {
        this.showFieldError(form, 'email', result.error || 'Invalid credentials');
        // Clear password field
        const passwordInput = form.querySelector('input[name="password"]');
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('An error occurred during login', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  async handleSocialLogin(provider) {
    showNotification(`Connecting to ${provider}...`, 'info');
    // Implement social login logic
    // This would redirect to OAuth provider
  }
}