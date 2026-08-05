// frontend/src/js/pages/ProfilePage.js

import BasePage from './BasePage.js';
import AuthService, { getUser, setUser } from '../modules/auth.js';
import { showNotification, formatCurrency, formatDate, getInitials } from '../modules/utils.js';

export default class ProfilePage extends BasePage {
    constructor(props) {
        super(props);
        this.title = 'My Profile';
        this.description = 'Manage your account details, addresses, and preferences';
        this.app = props?.app || null;
        this.activeTab = 'overview';
        this.user = getUser() || null;
        this.addresses = [];
        this.recentOrders = [];
        this.loading = false;
    }

    /**
     * Mount profile page
     */
    mount(container) {
        super.mount(container);
        this.loadData();
        return this;
    }

    /**
     * Load profile data
     */
    async loadData() {
        this.loading = true;
        this.render();

        // Load profile
        const profileResult = await AuthService.getProfile();
        if (profileResult.success) {
            this.user = profileResult.user;
            setUser(this.user);
        }

        // Load addresses
        const addressResult = await AuthService.getAddresses();
        if (addressResult.success) {
            this.addresses = addressResult.addresses || [];
        }

        // Load recent orders from app module
        if (this.app && this.app.modules?.orders) {
            this.recentOrders = this.app.modules.orders.orders || [];
        }

        this.loading = false;
        this.render();
    }

    /**
     * Template
     */
    template() {
        if (this.loading) {
            return `
                <div class="profile-page fade-in">
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <p>Loading profile...</p>
                    </div>
                </div>
            `;
        }

        const user = this.user || {};
        const profile = user.profile || {};
        const avatarUrl = profile.avatarUrl || user.avatarUrl;
        const fullName = user.name || 'User';
        const initials = getInitials(fullName);

        return `
            <div class="profile-page fade-in">
                <div class="profile-layout">
                    <!-- Sidebar -->
                    <aside class="profile-sidebar">
                        <div class="profile-avatar-wrapper">
                            ${avatarUrl
                                ? `<img src="${avatarUrl}" alt="${fullName}" class="profile-avatar" onerror="this.src='/placeholder.jpg'" />`
                                : `<div class="profile-avatar profile-avatar-initials">${initials}</div>`
                            }
                            <button class="avatar-upload-btn" data-action="upload-avatar" title="Change avatar">
                                <i class="fas fa-camera"></i>
                            </button>
                            <input type="file" id="avatarInput" accept="image/*" style="display:none;" />
                        </div>
                        <h2 class="profile-name">${fullName}</h2>
                        <p class="profile-email">${user.email || ''}</p>
                        <div class="profile-role-badge">${user.role || 'customer'}</div>

                        <nav class="profile-nav">
                            <button class="profile-nav-item ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
                                <i class="fas fa-id-card"></i> Overview
                            </button>
                            <button class="profile-nav-item ${this.activeTab === 'info' ? 'active' : ''}" data-tab="info">
                                <i class="fas fa-user-edit"></i> Profile Info
                            </button>
                            <button class="profile-nav-item ${this.activeTab === 'password' ? 'active' : ''}" data-tab="password">
                                <i class="fas fa-key"></i> Change Password
                            </button>
                            <button class="profile-nav-item ${this.activeTab === 'addresses' ? 'active' : ''}" data-tab="addresses">
                                <i class="fas fa-map-marker-alt"></i> Addresses
                            </button>
                        </nav>
                    </aside>

                    <!-- Main Content -->
                    <main class="profile-content">
                        ${this.renderTabContent()}
                    </main>
                </div>
            </div>
        `;
    }

    /**
     * Render current tab content
     */
    renderTabContent() {
        switch (this.activeTab) {
            case 'info':
                return this.renderInfoTab();
            case 'password':
                return this.renderPasswordTab();
            case 'addresses':
                return this.renderAddressesTab();
            case 'overview':
            default:
                return this.renderOverviewTab();
        }
    }

    /**
     * Render overview tab
     */
    renderOverviewTab() {
        const user = this.user || {};
        const profile = user.profile || {};
        const defaultAddress = this.addresses.find(a => a.isDefault) || this.addresses[0];
        const orderCount = this.recentOrders.length;
        const totalSpent = this.recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const stats = [
            { icon: 'fa-box', label: 'Orders', value: orderCount },
            { icon: 'fa-dollar-sign', label: 'Total Spent', value: formatCurrency(totalSpent) },
            { icon: 'fa-map-marker-alt', label: 'Addresses', value: this.addresses.length }
        ];

        return `
            <div class="profile-tab">
                <h1 class="profile-title">Overview</h1>

                <div class="profile-stats-grid">
                    ${stats.map(s => `
                        <div class="profile-stat-card">
                            <div class="profile-stat-icon"><i class="fas ${s.icon}"></i></div>
                            <div class="profile-stat-value">${s.value}</div>
                            <div class="profile-stat-label">${s.label}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="profile-cards-grid">
                    <div class="profile-card">
                        <h3><i class="fas fa-user"></i> Account Details</h3>
                        <div class="profile-detail-row">
                            <span class="detail-label">Name</span>
                            <span class="detail-value">${user.name || '—'}</span>
                        </div>
                        <div class="profile-detail-row">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${user.email || '—'}</span>
                        </div>
                        <div class="profile-detail-row">
                            <span class="detail-label">Phone</span>
                            <span class="detail-value">${user.phone || '—'}</span>
                        </div>
                        <div class="profile-detail-row">
                            <span class="detail-label">Member Since</span>
                            <span class="detail-value">${user.createdAt ? formatDate(user.createdAt) : '—'}</span>
                        </div>
                        <div class="profile-detail-row">
                            <span class="detail-label">Bio</span>
                            <span class="detail-value">${profile.bio || '—'}</span>
                        </div>
                    </div>

                    <div class="profile-card">
                        <h3><i class="fas fa-map-marker-alt"></i> Default Address</h3>
                        ${defaultAddress ? `
                            <p class="address-title">${defaultAddress.addressType || 'Shipping'}</p>
                            <p>${defaultAddress.street}</p>
                            <p>${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}</p>
                            <p>${defaultAddress.country}</p>
                        ` : `
                            <p class="text-muted">No address on file.</p>
                            <button class="btn btn-outline btn-sm" data-tab="addresses">
                                <i class="fas fa-plus"></i> Add Address
                            </button>
                        `}
                    </div>

                    ${this.recentOrders.length > 0 ? `
                        <div class="profile-card profile-card-wide">
                            <div class="profile-card-header">
                                <h3><i class="fas fa-box"></i> Recent Orders</h3>
                                <a href="/orders" class="btn btn-outline btn-sm" data-page="orders">View All</a>
                            </div>
                            <div class="recent-orders-list">
                                ${this.recentOrders.slice(0, 5).map(order => `
                                    <div class="recent-order-item">
                                        <div class="recent-order-info">
                                            <span class="recent-order-number">${order.orderNumber || order.id?.slice(0, 8)}</span>
                                            <span class="recent-order-date">${formatDate(order.createdAt)}</span>
                                        </div>
                                        <span class="recent-order-total">${formatCurrency(order.totalAmount)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render profile info tab
     */
    renderInfoTab() {
        const user = this.user || {};
        const profile = user.profile || {};
        const avatarUrl = profile.avatarUrl || user.avatarUrl;

        return `
            <div class="profile-tab">
                <h1 class="profile-title">Profile Information</h1>

                <div class="profile-form-card">
                    <div class="profile-avatar-edit">
                        ${avatarUrl
                            ? `<img src="${avatarUrl}" alt="Avatar" class="profile-avatar-lg" onerror="this.src='/placeholder.jpg'" />`
                            : `<div class="profile-avatar-lg profile-avatar-initials">${getInitials(user.name || 'U')}</div>`
                        }
                        <div>
                            <button class="btn btn-outline btn-sm" data-action="upload-avatar">
                                <i class="fas fa-camera"></i> Change Avatar
                            </button>
                            <p class="text-muted" style="margin-top:6px;font-size:12px;">JPG, PNG or WebP. Max 10MB.</p>
                        </div>
                    </div>

                    <form id="profileForm" novalidate>
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-control" name="name" value="${user.name || ''}" required />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" value="${user.email || ''}" disabled />
                            <small class="text-muted">Email cannot be changed.</small>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Phone</label>
                                <input type="tel" class="form-control" name="phone" value="${user.phone || ''}" placeholder="Enter phone number" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Gender</label>
                                <select class="form-control" name="gender">
                                    <option value="">Select</option>
                                    <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>Male</option>
                                    <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>Female</option>
                                    <option value="other" ${profile.gender === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Date of Birth</label>
                                <input type="date" class="form-control" name="dateOfBirth" value="${profile.dateOfBirth ? profile.dateOfBirth.toString().slice(0, 10) : ''}" />
                            </div>
                            <div class="form-group">
                                <label class="form-label">Preferred Language</label>
                                <select class="form-control" name="preferredLanguage">
                                    <option value="en" ${profile.preferredLanguage === 'en' ? 'selected' : ''}>English</option>
                                    <option value="es" ${profile.preferredLanguage === 'es' ? 'selected' : ''}>Spanish</option>
                                    <option value="fr" ${profile.preferredLanguage === 'fr' ? 'selected' : ''}>French</option>
                                    <option value="de" ${profile.preferredLanguage === 'de' ? 'selected' : ''}>German</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Bio</label>
                            <textarea class="form-control" name="bio" maxlength="500" placeholder="Tell us a little about yourself">${profile.bio || ''}</textarea>
                            <small class="text-muted">Max 500 characters.</small>
                        </div>

                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Render password tab
     */
    renderPasswordTab() {
        return `
            <div class="profile-tab">
                <h1 class="profile-title">Change Password</h1>

                <div class="profile-form-card">
                    <form id="passwordForm" novalidate>
                        <div class="form-group">
                            <label class="form-label">Current Password</label>
                            <input type="password" class="form-control" name="currentPassword" required autocomplete="current-password" />
                        </div>

                        <div class="form-group">
                            <label class="form-label">New Password</label>
                            <input type="password" class="form-control" name="newPassword" required minlength="8" autocomplete="new-password" />
                            <small class="text-muted">Must be at least 8 characters.</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Confirm New Password</label>
                            <input type="password" class="form-control" name="confirmNewPassword" required autocomplete="new-password" />
                        </div>

                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-key"></i> Update Password
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Render addresses tab
     */
    renderAddressesTab() {
        return `
            <div class="profile-tab">
                <div class="profile-tab-header">
                    <h1 class="profile-title">My Addresses</h1>
                    <button class="btn btn-primary" data-action="add-address">
                        <i class="fas fa-plus"></i> Add Address
                    </button>
                </div>

                ${this.addresses.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-map-marked-alt"></i>
                        <h3>No addresses yet</h3>
                        <p>Add an address to speed up checkout.</p>
                        <button class="btn btn-primary" data-action="add-address">
                            <i class="fas fa-plus"></i> Add Address
                        </button>
                    </div>
                ` : `
                    <div class="addresses-grid">
                        ${this.addresses.map(address => `
                            <div class="address-card ${address.isDefault ? 'default' : ''}">
                                <div class="address-card-header">
                                    <span class="address-type">${address.addressType || 'Shipping'}</span>
                                    ${address.isDefault ? '<span class="address-default-badge"><i class="fas fa-check-circle"></i> Default</span>' : ''}
                                </div>
                                <p class="address-street">${address.street}</p>
                                <p>${address.city}, ${address.state} ${address.zipCode}</p>
                                <p>${address.country}</p>
                                <div class="address-actions">
                                    <button class="btn btn-outline btn-sm" data-action="edit-address" data-address-id="${address.id}">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    ${!address.isDefault ? `
                                        <button class="btn btn-outline btn-sm" data-action="set-default" data-address-id="${address.id}">
                                            <i class="fas fa-check"></i> Set Default
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-danger btn-sm" data-action="delete-address" data-address-id="${address.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render address modal/form
     */
    renderAddressForm(address = null) {
        const isEdit = !!address;
        const a = address || {};

        return `
            <div class="modal-overlay profile-modal">
                <div class="modal profile-modal-box">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Address' : 'Add New Address'}</h3>
                        <button class="modal-close" data-action="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addressForm" novalidate>
                            <div class="form-group">
                                <label class="form-label">Street Address</label>
                                <input type="text" class="form-control" name="street" value="${a.street || ''}" required />
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">City</label>
                                    <input type="text" class="form-control" name="city" value="${a.city || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label">State/Province</label>
                                    <input type="text" class="form-control" name="state" value="${a.state || ''}" required />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">ZIP Code</label>
                                    <input type="text" class="form-control" name="zipCode" value="${a.zipCode || ''}" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Country</label>
                                    <input type="text" class="form-control" name="country" value="${a.country || ''}" required />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Address Type</label>
                                    <select class="form-control" name="addressType">
                                        <option value="shipping" ${a.addressType === 'shipping' ? 'selected' : ''}>Shipping</option>
                                        <option value="billing" ${a.addressType === 'billing' ? 'selected' : ''}>Billing</option>
                                    </select>
                                </div>
                                <div class="form-group set-default-check">
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="isDefault" ${a.isDefault ? 'checked' : ''} />
                                        Set as default address
                                    </label>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> ${isEdit ? 'Update Address' : 'Add Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach events
     */
    attachEvents() {
        // Tab navigation
        this.findAll('.profile-nav-item').forEach(btn => {
            this.addListener(btn, 'click', () => {
                this.activeTab = btn.dataset.tab;
                this.render();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Avatar upload
        this.findAll('[data-action="upload-avatar"]').forEach(btn => {
            this.addListener(btn, 'click', () => {
                const input = this.find('#avatarInput');
                if (input) input.click();
            });
        });

        const avatarInput = this.find('#avatarInput');
        if (avatarInput) {
            this.addListener(avatarInput, 'change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const result = await AuthService.updateAvatar(file);
                if (result.success) {
                    await this.loadData();
                }
            });
        }

        // Profile form submit
        const profileForm = this.find('#profileForm');
        if (profileForm) {
            this.addListener(profileForm, 'submit', async (e) => {
                e.preventDefault();
                await this.handleProfileSave(profileForm);
            });
        }

        // Password form submit
        const passwordForm = this.find('#passwordForm');
        if (passwordForm) {
            this.addListener(passwordForm, 'submit', async (e) => {
                e.preventDefault();
                await this.handlePasswordChange(passwordForm);
            });
        }

        // Add address button
        this.findAll('[data-action="add-address"]').forEach(btn => {
            this.addListener(btn, 'click', () => {
                this.showAddressForm(null);
            });
        });

        // Tab switches from cards (e.g., "Add Address" in overview)
        this.findAll('[data-tab]').forEach(btn => {
            this.addListener(btn, 'click', () => {
                this.activeTab = btn.dataset.tab;
                this.render();
            });
        });

        // Address actions (delegated)
        this.findAll('[data-action="edit-address"]').forEach(btn => {
            this.addListener(btn, 'click', () => {
                const id = btn.dataset.addressId;
                const address = this.addresses.find(a => a.id === id);
                if (address) this.showAddressForm(address);
            });
        });

        this.findAll('[data-action="set-default"]').forEach(btn => {
            this.addListener(btn, 'click', async () => {
                const id = btn.dataset.addressId;
                const result = await AuthService.setDefaultAddress(id);
                if (result.success) {
                    await this.loadData();
                }
            });
        });

        this.findAll('[data-action="delete-address"]').forEach(btn => {
            this.addListener(btn, 'click', async () => {
                const id = btn.dataset.addressId;
                if (confirm('Are you sure you want to delete this address?')) {
                    const result = await AuthService.deleteAddress(id);
                    if (result.success) {
                        await this.loadData();
                    }
                }
            });
        });
    }

    /**
     * Show address form modal
     */
    showAddressForm(address = null) {
        const existingModal = this.find('.profile-modal');
        if (existingModal) existingModal.remove();

        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = this.renderAddressForm(address);
        this.element.appendChild(modalWrapper.firstElementChild);

        const form = this.find('#addressForm');
        const closeModal = () => {
            const modal = this.find('.profile-modal');
            if (modal) modal.remove();
        };

        if (form) {
            this.addListener(form, 'submit', async (e) => {
                e.preventDefault();
                const data = this.getFormData(form);
                let result;
                if (address) {
                    result = await AuthService.updateAddress(address.id, data);
                } else {
                    result = await AuthService.addAddress({
                        ...data,
                        isDefault: data.isDefault === 'on' || data.isDefault === true
                    });
                }
                if (result.success) {
                    closeModal();
                    await this.loadData();
                }
            });
        }

        // Close buttons
        this.findAll('[data-action="close-modal"]').forEach(btn => {
            this.addListener(btn, 'click', closeModal);
        });
    }

    /**
     * Handle profile save
     */
    async handleProfileSave(form) {
        const data = this.getFormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const result = await AuthService.updateProfile({
            name: data.name,
            phone: data.phone,
            bio: data.bio,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            preferredLanguage: data.preferredLanguage
        });

        if (result.success) {
            this.user = result.user;
            showNotification('Profile updated successfully!', 'success');
            if (this.app) this.app.updateUI();
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }

    /**
     * Handle password change
     */
    async handlePasswordChange(form) {
        const data = this.getFormData(form);
        const { currentPassword, newPassword, confirmNewPassword } = data;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showNotification('Please fill in all password fields', 'warning');
            return;
        }

        if (newPassword.length < 8) {
            showNotification('New password must be at least 8 characters', 'warning');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showNotification('New passwords do not match', 'warning');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        const result = await AuthService.changePassword(currentPassword, newPassword);

        if (result.success) {
            form.reset();
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }

    /**
     * Get form data
     */
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }
}
