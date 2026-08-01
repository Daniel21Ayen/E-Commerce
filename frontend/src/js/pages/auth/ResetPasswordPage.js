// frontend/src/js/pages/auth/ResetPasswordPage.js

import BaseAuthPage from './BaseAuthPage.js';
import { showNotification } from '../../modules/utils.js';
import AuthService from '../../modules/auth.js';

export default class ResetPasswordPage extends BaseAuthPage {
  constructor(props) {
    super(props);
    this.title = 'Reset Password';
    this.redirectIfAuthenticated = false;
    this.app = props?.app || null;
    this.token = props?.token || '';
  }

  template() {
    return `
      <div class="auth-container fade-in">
        <div class="auth-card">
          <div class="auth-header">
            <span class="auth-logo">🔐</span>
            <h2>Create New Password</h2>
            <p>Enter your new password below</p>
          </div>
          
          <form id="resetPasswordForm" novalidate>
            <input type="hidden" name="token" value="${this.token}" />
            
            <div class="form-group">
              <label class="form-label">New Password <span class="required">*</span></label>
              <input 
                type="password" 
                class="form-control" 
                name="password" 
                placeholder="Enter new password" 
                required 
                minlength="8"
                autocomplete="new-password"
                autofocus
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">Confirm Password <span class="required">*</span></label>
              <input 
                type="password" 
                class="form-control" 
                name="confirmPassword" 
                placeholder="Confirm new password" 
                required
                autocomplete="new-password"
              />
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="resetBtn">
              <i class="fas fa-lock"></i> Reset Password
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
    const form = this.element?.querySelector('#resetPasswordForm');
    if (form) {
      this._addListener(form, 'submit', async (e) => {
        e.preventDefault();
        await this.handleResetPassword(form);
      });
    }
  }

  async handleResetPassword(form) {
    this.clearFormErrors(form);
    
    const data = this.getFormData(form);
    const { token, password, confirmPassword } = data;

    let hasError = false;

    if (!password || password.length < 8) {
      this.showFieldError(form, 'password', 'Password must be at least 8 characters');
      hasError = true;
    }

    if (password !== confirmPassword) {
      this.showFieldError(form, 'confirmPassword', 'Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    const submitBtn = form.querySelector('#resetBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

    try {
      const result = await AuthService.resetPassword(token, password);
      if (result.success) {
        showNotification('Password reset successfully! Please login.', 'success');
        setTimeout(() => {
          this.navigate('login');
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showNotification('Failed to reset password. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}