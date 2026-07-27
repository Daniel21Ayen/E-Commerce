/**
 * Search Module - Handles search functionality with autocomplete
 */

import ApiService from './api';
import { debounce } from './utils';

class SearchService {
  constructor() {
    this.query = '';
    this.results = [];
    this.suggestions = [];
    this.loading = false;
    this.active = false;
    this.listeners = [];
    this.debouncedSearch = debounce(this.performSearch.bind(this), 300);
  }

  /**
   * Initialize search
   */
  init() {
    // Setup search input listeners
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleInput(e.target.value);
      });
      
      searchInput.addEventListener('focus', () => {
        this.activate();
      });
      
      searchInput.addEventListener('blur', () => {
        setTimeout(() => this.deactivate(), 200);
      });
      
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clear();
        }
        if (e.key === 'Enter') {
          this.handleSubmit();
        }
      });
    }

    // Handle click outside
    document.addEventListener('click', (e) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(e.target)) {
        this.deactivate();
      }
    });
  }

  /**
   * Handle search input
   */
  handleInput(query) {
    this.query = query.trim();
    
    if (this.query.length === 0) {
      this.clearResults();
      this.notifyListeners();
      return;
    }

    if (this.query.length >= 2) {
      this.loading = true;
      this.notifyListeners();
      this.debouncedSearch(this.query);
    }
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    try {
      const response = await ApiService.products.search(query, 10);
      this.suggestions = response.data.data || [];
      this.loading = false;
      this.active = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Search error:', error);
      this.suggestions = [];
      this.loading = false;
      this.notifyListeners();
    }
  }

  /**
   * Get search results
   */
  async getResults(params = {}) {
    try {
      this.loading = true;
      const response = await ApiService.products.getAll({
        search: this.query,
        ...params
      });
      this.results = response.data.data || [];
      this.pagination = response.data.pagination || null;
      this.loading = false;
      this.notifyListeners();
      return this.results;
    } catch (error) {
      console.error('Search results error:', error);
      this.results = [];
      this.loading = false;
      return [];
    }
  }

  /**
   * Handle search submit
   */
  handleSubmit() {
    if (this.query.length >= 2) {
      window.location.href = `/search?q=${encodeURIComponent(this.query)}`;
    }
  }

  /**
   * Get suggestions
   */
  getSuggestions() {
    return this.suggestions;
  }

  /**
   * Get search query
   */
  getQuery() {
    return this.query;
  }

  /**
   * Set search query
   */
  setQuery(query) {
    this.query = query.trim();
    if (this.query.length >= 2) {
      this.performSearch(this.query);
    }
    this.notifyListeners();
  }

  /**
   * Clear search
   */
  clear() {
    this.query = '';
    this.results = [];
    this.suggestions = [];
    this.loading = false;
    this.active = false;
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    this.notifyListeners();
  }

  /**
   * Clear results
   */
  clearResults() {
    this.suggestions = [];
    this.results = [];
    this.loading = false;
  }

  /**
   * Activate search
   */
  activate() {
    if (this.query.length >= 2) {
      this.active = true;
      this.notifyListeners();
    }
  }

  /**
   * Deactivate search
   */
  deactivate() {
    this.active = false;
    this.notifyListeners();
  }

  /**
   * Check if search is active
   */
  isActive() {
    return this.active;
  }

  /**
   * Check if loading
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Get recent searches from localStorage
   */
  getRecentSearches(limit = 5) {
    try {
      const recent = localStorage.getItem('recent_searches');
      return recent ? JSON.parse(recent).slice(0, limit) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save search to recent
   */
  saveRecentSearch(query) {
    if (!query || query.length < 2) return;
    
    try {
      const recent = this.getRecentSearches(20);
      const filtered = recent.filter(item => item !== query);
      filtered.unshift(query);
      localStorage.setItem('recent_searches', JSON.stringify(filtered));
    } catch {
      // Ignore
    }
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches() {
    localStorage.removeItem('recent_searches');
  }

  /**
   * Highlight matching text
   */
  highlightMatch(text, query) {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Add listener for search changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          query: this.query,
          suggestions: this.suggestions,
          results: this.results,
          loading: this.loading,
          active: this.active,
          pagination: this.pagination
        });
      } catch (error) {
        console.error('Error in search listener:', error);
      }
    });
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;