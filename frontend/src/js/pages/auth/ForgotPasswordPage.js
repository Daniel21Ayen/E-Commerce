// frontend/src/js/pages/auth/ForgotPasswordPage.js

import BaseAuthPage from './BaseAuthPage.js';
import { showNotification } from '../../modules/utils.js';
import AuthService from '../../modules/auth.js';

export default class ForgotPasswordPage extends BaseAuthPage {
  constructor(props) {
    super(props);
    this.title = 'Forgot Password';
    this.redirectIfAuthenticated = false;
    this.app = props?.app || null;
  }

  template() {
    return `
      <div class="auth-container fade-in">
        <div class="auth-card">
          <div class="auth-header">
            <span class="auth-logo">🔐</span>
            <h2>Reset Password</h2>
            <p>Enter your email to receive a password reset link</p>
          </div>
          
          <form id="forgotPasswordForm" novalidate>
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
            
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="resetBtn">
              <i class="fas fa-paper-plane"></i> Send Reset Link
            </button>
          </form>
          
          <div class="auth-footer" style="margin-top:20px;">
            <a href="/login" data-page="login">Back to Login</a>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const form = this.element?.querySelector('#forgotPasswordForm');
    if (form) {
      this._addListener(form, 'submit', async (e) => {
        e.preventDefault();
        await this.handleForgotPassword(form);
      });
    }
  }

  async handleForgotPassword(form) {
    this.clearFormErrors(form);
    
    const data = this.getFormData(form);
    const { email } = data;

    if (!email) {
      this.showFieldError(form, 'email', 'Email is required');
      return;
    }

    const submitBtn = form.querySelector('#resetBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
      const result = await AuthService.forgotPassword(email);
      if (result.success) {
        showNotification('Password reset link sent to your email!', 'success');
        form.innerHTML = `
          <div class="text-center" style="padding:20px 0;">
            <i class="fas fa-check-circle" style="font-size:48px;color:var(--success);"></i>
            <h3>Check Your Email</h3>
            <p>We've sent a password reset link to <strong>${email}</strong></p>
            <a href="/login" data-page="login" class="btn btn-primary" style="margin-top:10px;">
              Back to Login
            </a>
          </div>
        `;
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showNotification('Failed to send reset link. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}