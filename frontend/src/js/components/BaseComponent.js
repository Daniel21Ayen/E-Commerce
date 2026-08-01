// src/js/components/BaseComponent.js

export default class BaseComponent {
    constructor(props = {}) {
        this.props = props;
        this.state = {};
        this.element = null;
        this.listeners = [];
        this._childComponents = [];
        this._isMounted = false;
    }

    /**
     * Set component state and re-render
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
        return this;
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get props
     */
    getProps() {
        return { ...this.props };
    }

    /**
     * Update props and re-render
     */
    setProps(newProps) {
        this.props = { ...this.props, ...newProps };
        this.render();
        return this;
    }

    /**
     * Render component
     */
    render() {
        if (this.element && this._isMounted) {
            this.element.innerHTML = this.template();
            this.afterRender();
            this._attachEvents();
        }
        return this.element;
    }

    /**
     * Component template - override in child classes
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
     * Internal method to attach events
     */
    _attachEvents() {
        this.attachEvents();
    }

    /**
     * Mount component to DOM
     */
    mount(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return this;

        // Create element if not exists
        if (!this.element) {
            this.element = document.createElement('div');
        }
        
        container.appendChild(this.element);
        this._isMounted = true;
        this.render();
        return this;
    }

    /**
     * Unmount component
     */
    unmount() {
        // Unmount child components
        this._childComponents.forEach(child => {
            if (child.unmount) {
                child.unmount();
            }
        });
        this._childComponents = [];

        // Remove event listeners
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];

        // Remove element from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this._isMounted = false;
        this.element = null;
    }

    /**
     * Add event listener with auto-cleanup
     */
    addListener(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
        return this;
    }

    /**
     * Remove specific event listener
     */
    removeListener(element, event, handler) {
        if (!element) return;
        element.removeEventListener(event, handler);
        this.listeners = this.listeners.filter(
            l => !(l.element === element && l.event === event && l.handler === handler)
        );
        return this;
    }

    /**
     * Emit custom event
     */
    emit(event, detail = {}) {
        if (this.element) {
            const customEvent = new CustomEvent(event, {
                detail,
                bubbles: true,
                composed: true
            });
            this.element.dispatchEvent(customEvent);
        }
        return this;
    }

    /**
     * Listen to custom event
     */
    on(event, handler) {
        if (this.element) {
            this.element.addEventListener(event, handler);
        }
        return this;
    }

    /**
     * Add child component
     */
    addChild(component) {
        this._childComponents.push(component);
        return component;
    }

    /**
     * Remove child component
     */
    removeChild(component) {
        this._childComponents = this._childComponents.filter(c => c !== component);
        if (component.unmount) {
            component.unmount();
        }
        return this;
    }

    /**
     * Get child components
     */
    getChildren() {
        return [...this._childComponents];
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.element) {
            this.element.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            `;
        }
        return this;
    }

    /**
     * Show error state
     */
    showError(message = 'Something went wrong') {
        if (this.element) {
            this.element.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
        return this;
    }

    /**
     * Show empty state
     */
    showEmpty(message = 'No items found') {
        if (this.element) {
            this.element.innerHTML = `
                <div class="empty-container">
                    <i class="fas fa-box-open"></i>
                    <h3>${message}</h3>
                    <p>Nothing to display here yet.</p>
                </div>
            `;
        }
        return this;
    }

    /**
     * Check if component is mounted
     */
    isMounted() {
        return this._isMounted;
    }

    /**
     * Get element
     */
    getElement() {
        return this.element;
    }

    /**
     * Find element within component
     */
    find(selector) {
        return this.element?.querySelector(selector);
    }

    /**
     * Find all elements within component
     */
    findAll(selector) {
        return this.element?.querySelectorAll(selector) || [];
    }
}