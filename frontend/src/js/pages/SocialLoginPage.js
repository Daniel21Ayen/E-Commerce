// frontend/src/js/pages/SocialLoginPage.js

import BasePage from './BasePage.js';
import AuthService from '../modules/auth.js';
import { showNotification } from '../modules/utils.js';

export default class SocialLoginPage extends BasePage {
    constructor(props) {
        super(props);
        this.app = props?.app || null;
        this.onSocialLogin = props?.onSocialLogin || null;
    }

    async mount(container) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
            const errorMessages = {
                'google_auth_failed': 'Google authentication failed. Please try again.',
                'facebook_auth_failed': 'Facebook authentication failed. Please try again.',
                'github_auth_failed': 'GitHub authentication failed. Please try again.',
                'google_not_configured': 'Google login is not configured yet. Please use email registration.',
                'facebook_not_configured': 'Facebook login is not configured yet. Please use email registration.',
                'github_not_configured': 'GitHub login is not configured yet. Please use email registration.'
            };
            showNotification(errorMessages[error] || 'Social login failed. Please try again.', 'error');
            window.history.replaceState({}, '', '/login');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        if (!token) {
            showNotification('Invalid login attempt.', 'error');
            window.history.replaceState({}, '', '/login');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        container.innerHTML = `
            <div class="auth-container fade-in">
                <div class="auth-card text-center">
                    <div class="auth-header">
                        <span class="auth-logo">🔄</span>
                        <h2>Processing Login</h2>
                        <p>Please wait while we log you in...</p>
                    </div>
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <p style="margin-top: 1rem; color: var(--gray-500);">Redirecting...</p>
                    </div>
                </div>
            </div>
        `;

        try {
            const result = await AuthService.handleSocialLogin(token);
            if (result.success) {
                // Clean the URL
                window.history.replaceState({}, '', '/social-login');
                
                // Trigger app login callback to update state & load user data
                if (this.app && typeof this.app.onSocialLogin === 'function') {
                    await this.app.onSocialLogin(result.user);
                } else if (this.app && this.app.user) {
                    this.app.user = result.user;
                    if (typeof this.app.updateUI === 'function') this.app.updateUI();
                }
                
                showNotification(`Welcome ${result.user.name}! 🎉`, 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                showNotification('Login failed. Please try again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
        } catch (error) {
            console.error('Social login error:', error);
            showNotification('Login failed. Please try again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
    }

    template() {
        return '';
    }
}