// frontend/src/js/pages/SocialLoginPage.js

import BasePage from '../BasePage.js';
import AuthService from '../modules/auth.js';
import { showNotification } from '../modules/utils.js';

export default class SocialLoginPage extends BasePage {
    constructor(props) {
        super(props);
        this.app = props?.app || null;
    }

    async mount(container) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
            const errorMessages = {
                'google_auth_failed': 'Google authentication failed. Please try again.',
                'facebook_auth_failed': 'Facebook authentication failed. Please try again.',
                'github_auth_failed': 'GitHub authentication failed. Please try again.'
            };
            showNotification(errorMessages[error] || 'Social login failed. Please try again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        if (!token) {
            showNotification('Invalid login attempt.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        try {
            const result = await AuthService.handleSocialLogin(token);
            if (result.success) {
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
    }

    template() {
        return '';
    }
}