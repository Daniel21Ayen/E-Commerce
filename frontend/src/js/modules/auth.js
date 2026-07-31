/**
 * Auth Module - Handles user authentication, token management, and user state
 */

import ApiService from './api';
import { showNotification, setLoading, removeLoading } from './utils';

// Token management
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

// Get token from localStorage
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// Set token in localStorage
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Get refresh token
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

// Set refresh token
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

// Get user data
export const getUser = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

// Set user data
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Check if user is admin
export const isAdmin = () => {
  const user = getUser();
  return user && (user.role === 'admin' || user.role === 'super_admin');
};

// Get user role
export const getUserRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

// Auth Service
class AuthService {
  /**
   * Register new user
   */
  static async register(data) {
    try {
      setLoading('register');
      const response = await ApiService.auth.register(data);
      const { user, token } = response.data.data;
      
      setToken(token);
      setUser(user);
      
      showNotification(i18n.t('auth.registerSuccess'), 'success');
      return { success: true, user };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.registerError'), 'error');
      return { success: false, error: error.message };
    } finally {
      removeLoading('register');
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    try {
      setLoading('login');
      const response = await ApiService.auth.login({ email, password });
      const { user, accessToken, refreshToken } = response.data.data;
      
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);
      
      showNotification(i18n.t('auth.loginSuccess'), 'success');
      return { success: true, user };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.loginError'), 'error');
      return { success: false, error: error.message };
    } finally {
      removeLoading('login');
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      await ApiService.auth.logout();
    } catch (error) {
      // Ignore errors on logout
    } finally {
      removeToken();
      window.location.href = '/login';
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile() {
    try {
      const response = await ApiService.auth.getProfile();
      const user = response.data.data;
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data) {
    try {
      setLoading('profile');
      const response = await ApiService.auth.updateProfile(data);
      const user = response.data.data;
      setUser(user);
      showNotification(i18n.t('auth.profileUpdated'), 'success');
      return { success: true, user };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.profileUpdateError'), 'error');
      return { success: false, error: error.message };
    } finally {
      removeLoading('profile');
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword, newPassword) {
    try {
      setLoading('password');
      await ApiService.auth.changePassword({ currentPassword, newPassword });
      showNotification(i18n.t('auth.passwordChanged'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.passwordChangeError'), 'error');
      return { success: false, error: error.message };
    } finally {
      removeLoading('password');
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(email) {
    try {
      setLoading('forgot');
      await ApiService.auth.forgotPassword(email);
      showNotification(i18n.t('auth.resetEmailSent'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.resetEmailError'), 'error');
      return { success: false, error: error.message };
    } finally {
      removeLoading('forgot');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token, password) {
    try {
      setLoading('reset');
      await ApiService.auth.resetPassword(token, { password });
      showNotification(i18n.t('auth.passwordReset'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.passwordResetError'), 'error');
      return { success: false, error: error.message };
    } finally {
      removeLoading('reset');
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token) {
    try {
      await ApiService.auth.verifyEmail(token);
      showNotification(i18n.t('auth.emailVerified'), 'success');
      return { success: true };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.emailVerifyError'), 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Social login with Google
   */
  static async socialLogin(provider, code) {
    try {
      setLoading('social');
      const response = await ApiService.auth.socialLogin({ provider, code });
      const { user, token } = response.data.data;
      setToken(token);
      setUser(user);
      showNotification(i18n.t('auth.loginSuccess'), 'success');
      return { success: true, user };
    } catch (error) {
      showNotification(error.message || i18n.t('auth.socialLoginError'), 'error');
      return { success: false, error: error.message };
    } finally {
      removeLoading('social');
    }
  }

  /**
   * Check auth status on page load
   */
  static async checkAuth() {
    if (!isAuthenticated()) {
      return { authenticated: false };
    }

    try {
      const result = await this.getProfile();
      if (result.success) {
        return { authenticated: true, user: result.user };
      } else {
        removeToken();
        return { authenticated: false };
      }
    } catch {
      removeToken();
      return { authenticated: false };
    }
  }
}

export default AuthService;