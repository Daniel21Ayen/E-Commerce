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
      // Validate
      if (!data.name?.trim()) {
        throw new Error('Name is required');
      }
      if (!data.email?.trim()) {
        throw new Error('Email is required');
      }
      if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      setLoading('register');
      
      const payload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        phone: data.phone || null
      };
      
      console.log('📝 Registering user:', { 
        name: payload.name, 
        email: payload.email,
        phone: payload.phone
      });
      
      const response = await ApiService.auth.register(payload);
      console.log('✅ Registration successful');
      
      const { user, token } = response.data.data;
      
      setToken(token);
      setUser(user);
      
      showNotification('Registration successful! Welcome to E-Shop!', 'success');
      return { success: true, user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let message = error.message || 'Registration failed';
      
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      // Show specific error messages
      if (error.response?.status === 409) {
        showNotification('Email already registered. Please login.', 'warning');
      } else if (error.response?.status === 400) {
        // Show validation errors
        const errors = error.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          const errorMessages = errors.map(e => e.message).join(', ');
          showNotification(errorMessages, 'error');
        } else {
          showNotification(message, 'error');
        }
      } else {
        showNotification(message, 'error');
      }
      
      return { success: false, error: message };
    } finally {
      removeLoading('register');
    }
  }

  /**
   * Login user
   */
 // src/js/modules/auth.js

static async login(email, password) {
  try {
    if (!email?.trim() || !password) {
      throw new Error('Email and password are required');
    }

    setLoading('login');
    
    const payload = {
      email: email.trim().toLowerCase(),
      password: password
    };
    
    console.log('🔑 Logging in user:', { email: payload.email });
    
    const response = await ApiService.auth.login(payload);
    console.log('✅ Login successful');
    
    const { user, accessToken, refreshToken } = response.data.data;
    
    setToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);
    
    showNotification('Login successful! Welcome back!', 'success');
    return { success: true, user };
  } catch (error) {
    console.error('❌ Login error:', error);
    
    // Handle different error types
    let message = 'Invalid email or password. Please try again.';
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message && !error.response) {
      message = error.message;
    }
    
    // Check if it's a network error
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      message = 'Network error. Please check your connection.';
    }
    
    // Check if it's a server error
    if (error.response?.status === 500) {
      message = 'Server error. Please try again later.';
    }
    
    showNotification(message, 'error');
    return { success: false, error: message };
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
      console.error('Logout error:', error);
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
      console.error('Get profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data) {
    try {
      setLoading('profile');
      
      const payload = {
        name: data.name?.trim(),
        phone: data.phone || null,
        bio: data.bio || null
      };
      
      const response = await ApiService.auth.updateProfile(payload);
      const user = response.data.data;
      setUser(user);
      
      showNotification('Profile updated successfully!', 'success');
      return { success: true, user };
    } catch (error) {
      console.error('Update profile error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      showNotification(message, 'error');
      return { success: false, error: message };
    } finally {
      removeLoading('profile');
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
      }

      setLoading('password');
      
      await ApiService.auth.changePassword({ 
        currentPassword, 
        newPassword 
      });
      
      showNotification('Password changed successfully!', 'success');
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to change password';
      
      if (error.response?.status === 401) {
        showNotification('Current password is incorrect', 'error');
      } else {
        showNotification(message, 'error');
      }
      
      return { success: false, error: message };
    } finally {
      removeLoading('password');
    }
  }

  /**
   * Forgot password
   */
  static async forgotPassword(email) {
    try {
      if (!email?.trim()) {
        throw new Error('Email is required');
      }

      setLoading('forgot');
      
      await ApiService.auth.forgotPassword(email.trim().toLowerCase());
      
      showNotification('Password reset email sent! Please check your inbox.', 'success');
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to send reset email';
      showNotification(message, 'error');
      return { success: false, error: message };
    } finally {
      removeLoading('forgot');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token, password) {
    try {
      if (!token) {
        throw new Error('Reset token is required');
      }
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      setLoading('reset');
      
      await ApiService.auth.resetPassword(token, { password });
      
      showNotification('Password reset successfully! Please login.', 'success');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to reset password';
      
      if (error.response?.status === 400) {
        showNotification('Invalid or expired reset token', 'error');
      } else {
        showNotification(message, 'error');
      }
      
      return { success: false, error: message };
    } finally {
      removeLoading('reset');
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token) {
    try {
      if (!token) {
        throw new Error('Verification token is required');
      }

      await ApiService.auth.verifyEmail(token);
      
      showNotification('Email verified successfully!', 'success');
      return { success: true };
    } catch (error) {
      console.error('Verify email error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to verify email';
      
      if (error.response?.status === 400) {
        showNotification('Invalid or expired verification token', 'error');
      } else {
        showNotification(message, 'error');
      }
      
      return { success: false, error: message };
    }
  }

  /**
   * Social login with Google
   */
  static async socialLogin(provider, code) {
    try {
      if (!provider || !code) {
        throw new Error('Provider and code are required');
      }

      setLoading('social');
      
      const response = await ApiService.auth.socialLogin({ provider, code });
      const { user, token } = response.data.data;
      
      setToken(token);
      setUser(user);
      
      showNotification(`Login with ${provider} successful!`, 'success');
      return { success: true, user };
    } catch (error) {
      console.error('Social login error:', error);
      const message = error.response?.data?.message || error.message || 'Social login failed';
      showNotification(message, 'error');
      return { success: false, error: message };
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
    } catch (error) {
      console.error('Check auth error:', error);
      removeToken();
      return { authenticated: false };
    }
  }

  /**
   * Get auth headers for requests
   */
  static getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role) {
    const user = getUser();
    return user && user.role === role;
  }

  /**
   * Check if user has any of the given roles
   */
  static hasAnyRole(roles) {
    const user = getUser();
    return user && roles.includes(user.role);
  }
}
 
export default AuthService;