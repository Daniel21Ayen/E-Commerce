// src/js/components/BaseComponent.js

export default class BaseComponent {
    constructor() {
        this.state = {};
        this.props = {};
        this.element = null;
        this.listeners = [];
    }

    /**
     * Set component state
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    /**
     * Get component state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Render component
     */
    render() {
        if (this.element) {
            this.element.innerHTML = this.template();
            this.afterRender();
            this.attachEvents();
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
     * Mount component to DOM
     */
    mount(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;
        
        this.element = document.createElement('div');
        container.appendChild(this.element);
        this.render();
        return this;
    }

    /**
     * Unmount component
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
    }

    /**
     * Add event listener with auto-cleanup
     */
    addListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    /**
     * Emit custom event
     */
    emit(event, detail = {}) {
        if (this.element) {
            const customEvent = new CustomEvent(event, { 
                detail, 
                bubbles: true 
            });
            this.element.dispatchEvent(customEvent);
        }
    }

    /**
     * Listen to custom event
     */
    on(event, handler) {
        if (this.element) {
            this.element.addEventListener(event, handler);
        }
    }
}