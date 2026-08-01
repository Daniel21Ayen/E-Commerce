// frontend/src/js/pages/BasePage.js

import BaseComponent from '../components/BaseComponent.js';

export default class BasePage extends BaseComponent {
  constructor(props = {}) {
    super(props);
    this.app = props.app || null;
    this.container = props.container || null;
    this.loading = false;
    this.title = props.title || '';
    this.description = props.description || '';
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.loading = true;
    if (this.element) {
      this.render();
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.loading = false;
    if (this.element) {
      this.render();
    }
  }

  /**
   * Navigate to another page
   */
  navigate(page, params = {}) {
    if (this.app && this.app.navigateTo) {
      this.app.navigateTo(page, params);
    } else {
      window.location.href = `/${page}`;
    }
  }

  /**
   * Get query parameters from URL
   */
  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Get page title
   */
  getTitle() {
    return this.title || 'Page';
  }

  /**
   * Get page description
   */
  getDescription() {
    return this.description || '';
  }

  /**
   * Update page meta tags
   */
  updateMeta() {
    document.title = this.getTitle();
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = this.getDescription();
    }
  }

  /**
   * Render the page - override in child classes
   */
  render() {
    if (this.element) {
      if (this.loading) {
        this.element.innerHTML = `
          <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading...</p>
          </div>
        `;
      } else {
        this.element.innerHTML = this.template();
        this.afterRender();
        this.attachEvents();
      }
    }
    return this.element;
  }

  /**
   * Template method - override in child classes
   */
  template() {
    return '';
  }

  /**
   * After render hook - override in child classes
   */
  afterRender() {}

  /**
   * Attach events - override in child classes
   */
  attachEvents() {}

  /**
   * Mount page to container
   */
  mount(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return this;

    this.container = container;
    this.element = document.createElement('div');
    container.appendChild(this.element);
    this.render();
    this.updateMeta();
    return this;
  }

  /**
   * Unmount page
   */
  unmount() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
    this._listeners = [];
    this._childComponents = [];
  }
}