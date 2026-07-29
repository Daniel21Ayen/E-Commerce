const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const logger = require('../middleware/logger');
const redis = require('../config/redis');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.templates = {};
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000;
    this.loadTemplates();
    this.configureTransporter();
  }

  /**
   * Load email templates
   */
  loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      // Create templates directory if it doesn't exist
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }

      // Define template files
      const templateFiles = {
        'welcome': 'welcome.html',
        'order-confirmation': 'order-confirmation.html',
        'order-status': 'order-status.html',
        'password-reset': 'password-reset.html',
        'abandoned-cart': 'abandoned-cart.html',
        'order-tracking': 'order-tracking.html',
        'promo-code': 'promo-code.html',
        'review-request': 'review-request.html',
        'low-stock': 'low-stock.html',
        'payment-receipt': 'payment-receipt.html',
        'shipping-confirmation': 'shipping-confirmation.html',
        'delivery-confirmation': 'delivery-confirmation.html',
        'password-change': 'password-change.html',
        'email-verification': 'email-verification.html',
        'newsletter': 'newsletter.html',
        'order-cancellation': 'order-cancellation.html',
        'refund-confirmation': 'refund-confirmation.html',
        'wishlist-reminder': 'wishlist-reminder.html',
        'price-drop': 'price-drop.html',
        'back-in-stock': 'back-in-stock.html'
      };

      // Load each template
      for (const [name, file] of Object.entries(templateFiles)) {
        const templatePath = path.join(templatesDir, file);
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          this.templates[name] = handlebars.compile(templateContent);
          logger.info(`Loaded email template: ${name}`);
        } else {
          this.createDefaultTemplate(templatePath, name);
        }
      }
    } catch (error) {
      logger.error('Error loading email templates:', error);
    }
  }

  /**
   * Create default template
   */
  createDefaultTemplate(templatePath, templateName) {
    try {
      const defaultTemplate = this.getDefaultTemplate(templateName);
      fs.writeFileSync(templatePath, defaultTemplate, 'utf8');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      this.templates[templateName] = handlebars.compile(templateContent);
      logger.info(`Created default email template: ${templateName}`);
    } catch (error) {
      logger.error(`Error creating default template ${templateName}:`, error);
    }
  }

  /**
   * Get default template HTML
   */
  getDefaultTemplate(type) {
    const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .content { padding: 30px; background: white; }
        .content h2 { color: #333; margin-top: 0; }
        .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; margin: 20px 0; }
        .button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        .footer a { color: #667eea; text-decoration: none; }
        .status-badge { display: inline-block; padding: 6px 16px; background: #4CAF50; color: white; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-details table { width: 100%; border-collapse: collapse; }
        .order-details th, .order-details td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        .order-details th { background: #e9ecef; font-weight: 600; }
        .order-details tr:last-child td { border-bottom: none; }
        .highlight { color: #667eea; font-weight: 600; }
        @media only screen and (max-width: 600px) {
            .content { padding: 20px; }
            .header { padding: 20px; }
            .header h1 { font-size: 24px; }
            .button { display: block; text-align: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛍️ {{storeName}}</h1>
            <p>{{storeTagline}}</p>
        </div>
        <div class="content">
            <h2>{{subject}}</h2>
            <p>Hello {{name}},</p>
            <div>{{{content}}}</div>
            {{#if buttonText}}
            <div style="text-align: center;">
                <a href="{{buttonUrl}}" class="button">{{buttonText}}</a>
            </div>
            {{/if}}
        </div>
        <div class="footer">
            <p>&copy; {{year}} {{storeName}}. All rights reserved.</p>
            <p>
                <a href="{{unsubscribeUrl}}">Unsubscribe</a> | 
                <a href="{{privacyUrl}}">Privacy Policy</a> | 
                <a href="{{termsUrl}}">Terms of Service</a>
            </p>
            <p style="margin-top: 10px; font-size: 11px; color: #999;">
                This email was sent to {{email}}. If you have any questions, contact us at 
                <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

    const templates = {
      'welcome': baseTemplate,
      'order-confirmation': baseTemplate,
      'order-status': baseTemplate,
      'password-reset': baseTemplate,
      'abandoned-cart': baseTemplate,
      'order-tracking': baseTemplate,
      'promo-code': baseTemplate,
      'review-request': baseTemplate,
      'low-stock': baseTemplate,
      'payment-receipt': baseTemplate,
      'shipping-confirmation': baseTemplate,
      'delivery-confirmation': baseTemplate,
      'password-change': baseTemplate,
      'email-verification': baseTemplate,
      'newsletter': baseTemplate,
      'order-cancellation': baseTemplate,
      'refund-confirmation': baseTemplate,
      'wishlist-reminder': baseTemplate,
      'price-drop': baseTemplate,
      'back-in-stock': baseTemplate
    };

    return templates[type] || baseTemplate;
  }

  /**
   * Configure email transporter
   */
  configureTransporter() {
    try {
      const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT) || 10
      };

      // Use default config if SMTP is not configured
      if (!process.env.SMTP_HOST) {
        logger.warn('SMTP not configured, using default configuration');
        config.host = 'smtp.gmail.com';
        config.auth.user = 'test@example.com';
        config.auth.pass = 'test';
      }

      this.transporter = nodemailer.createTransport(config);

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
          this.isConfigured = false;
        } else {
          logger.info('✅ Email transporter configured successfully');
          this.isConfigured = true;
        }
      });

      return this.transporter;
    } catch (error) {
      logger.error('Error configuring email transporter:', error);
      this.isConfigured = false;
      return null;
    }
  }

  /**
   * Send email with retry logic
   */
  async sendEmail({ 
    to, 
    subject, 
    template, 
    data = {}, 
    attachments = [], 
    cc = [], 
    bcc = [],
    priority = 'normal',
    trackOpens = true,
    trackClicks = true
  }) {
    const emailId = this.generateEmailId();
    
    try {
      // Validate email
      if (!this.isConfigured) {
        this.configureTransporter();
        if (!this.isConfigured) {
          throw new Error('Email service not configured');
        }
      }

      // Prepare email data
      const emailData = {
        to: Array.isArray(to) ? to : [to],
        subject,
        template,
        data: {
          ...data,
          storeName: process.env.STORE_NAME || 'E-Commerce',
          storeTagline: process.env.STORE_TAGLINE || 'Your One-Stop Shop',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@ecommerce.com',
          year: new Date().getFullYear(),
          email: Array.isArray(to) ? to[0] : to,
          unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(Array.isArray(to) ? to[0] : to)}`,
          privacyUrl: `${process.env.FRONTEND_URL}/privacy`,
          termsUrl: `${process.env.FRONTEND_URL}/terms`
        },
        attachments: attachments.map(att => ({
          ...att,
          cid: att.cid || `attachment_${Date.now()}_${Math.random()}`
        })),
        cc: Array.isArray(cc) ? cc : [cc].filter(Boolean),
        bcc: Array.isArray(bcc) ? bcc : [bcc].filter(Boolean),
        priority,
        trackOpens,
        trackClicks
      };

      // Add tracking parameters if enabled
      if (trackOpens || trackClicks) {
        emailData.data.trackingId = emailId;
        if (emailData.data.buttonUrl) {
          emailData.data.buttonUrl = this.addTrackingParams(emailData.data.buttonUrl, emailId);
        }
      }

      // Compile template
      let html;
      if (template && this.templates[template]) {
        html = this.templates[template](emailData.data);
      } else {
        // Fallback to plain text
        html = this.generateFallbackEmail(emailData);
      }

      // Prepare mail options
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ecommerce.com',
        to: emailData.to.join(', '),
        subject: emailData.subject,
        html,
        text: this.stripHtml(html),
        attachments: emailData.attachments,
        cc: emailData.cc.length ? emailData.cc.join(', ') : undefined,
        bcc: emailData.bcc.length ? emailData.bcc.join(', ') : undefined,
        headers: {
          'X-Priority': this.getPriorityHeader(priority),
          'X-Mailer': 'E-Commerce App',
          'X-Email-ID': emailId,
          'List-Unsubscribe': `<mailto:unsubscribe@ecommerce.com>`,
          'X-Tracking-Enabled': trackOpens ? 'true' : 'false'
        }
      };

      // Add tracking pixel if enabled
      if (trackOpens) {
        const trackingPixel = `<img src="${process.env.FRONTEND_URL}/api/tracking/open/${emailId}" width="1" height="1" style="display:none;" />`;
        mailOptions.html = html + trackingPixel;
      }

      // Send email with retry
      const result = await this.sendWithRetry(mailOptions);

      // Log successful send
      logger.info(`Email sent successfully to ${emailData.to.join(', ')}`, {
        emailId,
        template,
        subject,
        to: emailData.to,
        cc: emailData.cc,
        priority
      });

      // Store in cache for tracking
      await redis.set(`email:${emailId}`, {
        to: emailData.to,
        subject,
        template,
        sentAt: new Date().toISOString(),
        status: 'sent'
      }, 60 * 60 * 24 * 7); // 7 days

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
        accepted: result.accepted,
        rejected: result.rejected,
        emailId
      };

    } catch (error) {
      logger.error('Error sending email:', error);
      
      // Add to failed queue
      await this.addToFailedQueue({
        emailId,
        to,
        subject,
        template,
        data,
        attachments,
        cc,
        bcc,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        emailId
      };
    }
  }

  /**
   * Send email with retry logic
   */
  async sendWithRetry(mailOptions, retryCount = 0) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        logger.warn(`Retrying email send (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.sendWithRetry(mailOptions, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Generate email ID
   */
  generateEmailId() {
    return `email_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Add tracking parameters to URL
   */
  addTrackingParams(url, emailId) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=email&utm_medium=email&utm_campaign=transactional&email_id=${emailId}`;
  }

  /**
   * Get priority header
   */
  getPriorityHeader(priority) {
    const priorities = {
      high: '1 (Highest)',
      normal: '3 (Normal)',
      low: '5 (Lowest)'
    };
    return priorities[priority] || priorities.normal;
  }

  /**
   * Strip HTML for plain text version
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate fallback email
   */
  generateFallbackEmail(emailData) {
    return `
      <h2>${emailData.subject}</h2>
      <p>Hello ${emailData.data.name || 'Customer'},</p>
      <p>${emailData.data.content || 'Please check your email for more details.'}</p>
      ${emailData.data.buttonText ? `<a href="${emailData.data.buttonUrl}" style="padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">${emailData.data.buttonText}</a>` : ''}
    `;
  }

  /**
   * Add to failed queue
   */
  async addToFailedQueue(emailData) {
    try {
      const failedKey = 'email:failed:queue';
      const failedEmails = await redis.get(failedKey) || [];
      failedEmails.push({
        ...emailData,
        timestamp: new Date().toISOString(),
        retryCount: 0
      });
      await redis.set(failedKey, failedEmails, 60 * 60 * 24 * 30); // 30 days
    } catch (error) {
      logger.error('Failed to add email to failed queue:', error);
    }
  }

  /**
   * Process failed emails
   */
  async processFailedEmails() {
    try {
      const failedKey = 'email:failed:queue';
      const failedEmails = await redis.get(failedKey) || [];
      
      if (!failedEmails.length) return;

      const processed = [];
      const remaining = [];

      for (const email of failedEmails) {
        if (email.retryCount >= this.maxRetries) {
          // Skip after max retries
          continue;
        }

        const result = await this.sendEmail({
          to: email.to,
          subject: email.subject,
          template: email.template,
          data: email.data,
          attachments: email.attachments,
          cc: email.cc,
          bcc: email.bcc
        });

        if (result.success) {
          processed.push(email);
        } else {
          email.retryCount++;
          email.lastError = result.error;
          email.lastAttempt = new Date().toISOString();
          remaining.push(email);
        }

        // Delay between processing
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update queue
      await redis.set(failedKey, remaining, 60 * 60 * 24 * 30);

      logger.info(`Processed failed emails: ${processed.length} succeeded, ${remaining.length} remaining`);

      return { processed: processed.length, remaining: remaining.length };
    } catch (error) {
      logger.error('Error processing failed emails:', error);
      return { processed: 0, remaining: 0 };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(recipients, subject, template, data = {}, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 50;
    const delayBetweenBatches = options.delayBetweenBatches || 1000;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(recipient => 
        this.sendEmail({
          to: recipient.email,
          subject,
          template,
          data: { 
            ...data, 
            name: recipient.name || 'Customer',
            email: recipient.email
          },
          ...options
        })
      );

      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            email: batch[index].email,
            success: result.value.success,
            ...result.value
          });
        } else {
          results.push({
            email: batch[index].email,
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Log progress
      logger.info(`Bulk email progress: ${Math.min(i + batchSize, recipients.length)}/${recipients.length}`);

      // Delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return {
      total: recipients.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: `Welcome to ${process.env.STORE_NAME || 'E-Commerce'}! 🎉`,
      template: 'welcome',
      data: {
        name: user.name,
        content: `
          <p>We're excited to have you on board! Your account has been successfully created.</p>
          <p>You can now start shopping and explore our wide range of products.</p>
          <p>Here's what you can do:</p>
          <ul style="padding-left: 20px;">
            <li style="margin-bottom: 8px;">🛍️ Browse our product catalog</li>
            <li style="margin-bottom: 8px;">❤️ Add items to your wishlist</li>
            <li style="margin-bottom: 8px;">📦 Create and manage your orders</li>
            <li style="margin-bottom: 8px;">⭐ Write reviews for products you love</li>
          </ul>
          <p>To get started, check out our latest deals and exclusive offers.</p>
        `,
        buttonText: 'Start Shopping',
        buttonUrl: `${process.env.FRONTEND_URL}/products`
      }
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order, user) {
    const orderItems = order.items.map(item => 
      `<tr>
        <td>${item.productName}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    return this.sendEmail({
      to: user.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      template: 'order-confirmation',
      data: {
        name: user.name,
        orderNumber: order.orderNumber,
        content: `
          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge">Order Confirmed</span>
          </div>
          <p>Thank you for your order! We've received your order and are processing it.</p>
          <div class="order-details">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItems}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="text-align: right; font-weight: 600;">Subtotal:</td>
                  <td style="text-align: right;">$${order.subtotal.toFixed(2)}</td>
                </tr>
                ${order.discountAmount > 0 ? `
                <tr>
                  <td colspan="2" style="text-align: right; color: #dc3545;">Discount:</td>
                  <td style="text-align: right; color: #dc3545;">-$${order.discountAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="text-align: right; font-weight: 600;">Total:</td>
                  <td style="text-align: right; font-weight: 600; font-size: 18px; color: #667eea;">$${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <hr>
            <h4>Shipping Address:</h4>
            <p style="margin: 0;">
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
              ${order.shippingAddress.country}
            </p>
          </div>
          ${order.estimatedDeliveryDate ? `<p><strong>📦 Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>` : ''}
          <p style="color: #666; font-size: 14px;">You can track your order status from your account dashboard.</p>
        `,
        buttonText: 'View Order',
        buttonUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`
      }
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(order, user, status, previousStatus) {
    const statusMessages = {
      'pending': 'Your order has been placed and is waiting for processing.',
      'processing': 'Your order is being processed and prepared for shipment.',
      'shipped': 'Your order has been shipped! Check the tracking details below.',
      'delivered': 'Your order has been delivered! We hope you enjoy your purchase.',
      'cancelled': 'Your order has been cancelled.',
      'refunded': 'Your order has been refunded.',
      'failed': 'There was an issue with your order. Please contact support.'
    };

    const statusColors = {
      'pending': '#ffc107',
      'processing': '#17a2b8',
      'shipped': '#007bff',
      'delivered': '#28a745',
      'cancelled': '#dc3545',
      'refunded': '#6c757d',
      'failed': '#dc3545'
    };

    return this.sendEmail({
      to: user.email,
      subject: `Order ${order.orderNumber} Status Update: ${status.toUpperCase()}`,
      template: 'order-status',
      data: {
        name: user.name,
        orderNumber: order.orderNumber,
        status: status.toUpperCase(),
        content: `
          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge" style="background: ${statusColors[status]};">
              ${status.toUpperCase()}
            </span>
          </div>
          <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
          ${order.trackingNumber ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>📦 Tracking Number:</strong> ${order.trackingNumber}</p>
              ${order.trackingCarrier ? `<p style="margin: 5px 0 0;"><strong>Carrier:</strong> ${order.trackingCarrier}</p>` : ''}
            </div>
          ` : ''}
          ${order.estimatedDeliveryDate ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>📅 Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>
            </div>
          ` : ''}
          ${status === 'delivered' ? `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;">❤️ We hope you love your purchase! Consider leaving a review.</p>
            </div>
          ` : ''}
        `,
        buttonText: status === 'shipped' || status === 'delivered' ? 'Track Order' : 'View Order',
        buttonUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        name: user.name,
        content: `
          <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px;">🔒 This link will expire in <strong>1 hour</strong>.</p>
          </div>
          <p>Click the button below to reset your password.</p>
        `,
        buttonText: 'Reset Password',
        buttonUrl: resetUrl
      }
    });
  }

  /**
   * Send abandoned cart email
   */
  async sendAbandonedCartEmail(user, cartItems, cartTotal) {
    const itemsList = cartItems.map(item => 
      `<li style="margin-bottom: 8px;">${item.productName} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`
    ).join('');

    return this.sendEmail({
      to: user.email,
      subject: `Don't Forget Your Cart! 🛒 - ${process.env.STORE_NAME || 'E-Commerce'}`,
      template: 'abandoned-cart',
      data: {
        name: user.name,
        content: `
          <p>You left some items in your cart. Don't miss out on these great deals!</p>
          <div class="order-details">
            <h4 style="margin-top: 0;">Items in your cart:</h4>
            <ul style="padding-left: 20px; list-style: none;">
              ${itemsList}
            </ul>
            <hr>
            <p style="margin: 0; font-size: 18px; font-weight: 600; text-align: right;">
              Cart Total: <span class="highlight">$${cartTotal.toFixed(2)}</span>
            </p>
          </div>
          <p>🔄 These items are in high demand and may sell out soon.</p>
          <p>💳 Complete your purchase now and get free shipping on orders over $50!</p>
        `,
        buttonText: 'Complete Your Purchase',
        buttonUrl: `${process.env.FRONTEND_URL}/cart`
      }
    });
  }

  /**
   * Send order tracking email
   */
  async sendOrderTrackingEmail(order, user, trackingEvents) {
    const eventsList = trackingEvents.map(event => 
      `<li style="margin-bottom: 8px;">
        <strong>${event.status}</strong> - ${event.description}
        <span style="color: #666; font-size: 12px; display: block;">
          ${new Date(event.timestamp).toLocaleString()}
        </span>
      </li>`
    ).join('');

    return this.sendEmail({
      to: user.email,
      subject: `Order ${order.orderNumber} - Tracking Update`,
      template: 'order-tracking',
      data: {
        name: user.name,
        orderNumber: order.orderNumber,
        content: `
          <p>Your order is on its way! Here are the latest tracking updates:</p>
          <div class="order-details">
            <h4 style="margin-top: 0;">Tracking Timeline:</h4>
            <ul style="padding-left: 20px;">
              ${eventsList}
            </ul>
          </div>
          ${order.estimatedDeliveryDate ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>📅 Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>
            </div>
          ` : ''}
          ${order.trackingNumber ? `
            <p style="color: #666; font-size: 14px;">
              <strong>Tracking Number:</strong> ${order.trackingNumber}
              ${order.trackingCarrier ? `<br><strong>Carrier:</strong> ${order.trackingCarrier}` : ''}
            </p>
          ` : ''}
        `,
        buttonText: 'Track Order',
        buttonUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`
      }
    });
  }

  /**
   * Send promo code email
   */
  async sendPromoCodeEmail(user, promoCode) {
    const discountText = promoCode.discountType === 'percentage' 
      ? `${promoCode.discountValue}% OFF` 
      : `$${promoCode.discountValue} OFF`;

    return this.sendEmail({
      to: user.email,
      subject: `🎉 Special Offer: ${promoCode.code}`,
      template: 'promo-code',
      data: {
        name: user.name,
        content: `
          <p>We have a special offer just for you!</p>
          <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; margin: 20px 0;">
            <h2 style="color: white; margin: 0; font-size: 36px; letter-spacing: 4px;">${promoCode.code}</h2>
            <p style="color: white; margin: 10px 0 0; font-size: 20px; font-weight: 300;">${discountText}</p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${promoCode.minPurchase ? `<p style="margin: 0;"><strong>Minimum Purchase:</strong> $${promoCode.minPurchase.toFixed(2)}</p>` : ''}
            ${promoCode.maxDiscount ? `<p style="margin: 0;"><strong>Maximum Discount:</strong> $${promoCode.maxDiscount.toFixed(2)}</p>` : ''}
            ${promoCode.expiresAt ? `<p style="margin: 0;"><strong>Expires:</strong> ${new Date(promoCode.expiresAt).toLocaleDateString()}</p>` : ''}
          </div>
          <p>Don't miss out on this amazing deal! Use the code above at checkout.</p>
        `,
        buttonText: 'Shop Now',
        buttonUrl: process.env.FRONTEND_URL
      }
    });
  }

  /**
   * Send review request email
   */
  async sendReviewRequestEmail(user, order, product) {
    return this.sendEmail({
      to: user.email,
      subject: `Rate Your Purchase: ${product.name}`,
      template: 'review-request',
      data: {
        name: user.name,
        content: `
          <p>We hope you're enjoying your recent purchase! We'd love to hear your feedback.</p>
          <div class="order-details">
            <p style="margin: 0;"><strong>Product:</strong> ${product.name}</p>
            <p style="margin: 5px 0 0;"><strong>Order:</strong> ${order.orderNumber}</p>
          </div>
          <p>Your review helps other customers make informed decisions and helps us improve our products.</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; letter-spacing: 5px;">⭐⭐⭐⭐⭐</span>
          </div>
          <p style="color: #666; font-size: 14px;">It only takes a minute to share your experience.</p>
        `,
        buttonText: 'Write a Review',
        buttonUrl: `${process.env.FRONTEND_URL}/products/${product.id}/review`
      }
    });
  }

  /**
   * Send low stock alert email (admin)
   */
  async sendLowStockAlert(products) {
    const productsList = products.map(p => 
      `<tr>
        <td>${p.name}</td>
        <td style="text-align: center;">${p.stockQuantity}</td>
        <td style="text-align: center; color: ${p.stockQuantity <= 0 ? '#dc3545' : '#ffc107'};">
          ${p.stockQuantity <= 0 ? 'Out of Stock' : 'Low Stock'}
        </td>
        <td style="text-align: center;">${p.lowStockThreshold}</td>
      </tr>`
    ).join('');

    return this.sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@ecommerce.com',
      subject: '⚠️ Low Stock Alert - Action Required',
      template: 'low-stock',
      data: {
        name: 'Admin',
        content: `
          <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0; font-weight: 600;">⚠️ ${products.length} products are running low on stock or are out of stock!</p>
          </div>
          <p>The following products require your attention:</p>
          <div class="order-details">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Current Stock</th>
                  <th style="text-align: center;">Status</th>
                  <th style="text-align: center;">Threshold</th>
                </tr>
              </thead>
              <tbody>
                ${productsList}
              </tbody>
            </table>
          </div>
          <p>Please restock these items as soon as possible to avoid losing sales.</p>
        `,
        buttonText: 'View Inventory',
        buttonUrl: `${process.env.FRONTEND_URL}/admin/inventory`
      }
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceipt(order, user, payment) {
    return this.sendEmail({
      to: user.email,
      subject: `Payment Receipt #${payment.transactionId}`,
      template: 'payment-receipt',
      data: {
        name: user.name,
        content: `
          <div class="order-details">
            <h3 style="margin-top: 0;">Payment Receipt</h3>
            <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
            <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
          </div>
          <p style="color: #666; font-size: 14px;">This receipt serves as confirmation of your payment.</p>
        `,
        buttonText: 'Download Invoice',
        buttonUrl: `${process.env.FRONTEND_URL}/orders/${order.id}/invoice`
      }
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      data: {
        name: user.name,
        content: `
          <p>Please verify your email address to complete your registration.</p>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196F3;">
            <p style="margin: 0; font-size: 14px;">🔐 This link will expire in <strong>24 hours</strong>.</p>
          </div>
          <p>Click the button below to verify your email address.</p>
        `,
        buttonText: 'Verify Email',
        buttonUrl: verificationUrl
      }
    });
  }

  /**
   * Send price drop alert
   */
  async sendPriceDropAlert(user, product, oldPrice, newPrice) {
    const savings = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1);
    
    return this.sendEmail({
      to: user.email,
      subject: `💰 Price Drop Alert: ${product.name}`,
      template: 'price-drop',
      data: {
        name: user.name,
        content: `
          <p>Great news! An item on your wishlist has dropped in price.</p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0;">${product.name}</h3>
            <p style="margin: 10px 0;">
              <span style="text-decoration: line-through; color: #999;">$${oldPrice.toFixed(2)}</span>
              <span style="font-size: 24px; font-weight: 600; color: #dc3545; margin-left: 10px;">$${newPrice.toFixed(2)}</span>
            </p>
            <p style="margin: 0; color: #28a745; font-weight: 600;">Save ${savings}%!</p>
          </div>
          <p>Don't miss this opportunity to get it at a lower price!</p>
        `,
        buttonText: 'View Product',
        buttonUrl: `${process.env.FRONTEND_URL}/products/${product.id}`
      }
    });
  }

  /**
   * Send back in stock alert
   */
  async sendBackInStockAlert(user, product) {
    return this.sendEmail({
      to: user.email,
      subject: `✅ Back in Stock: ${product.name}`,
      template: 'back-in-stock',
      data: {
        name: user.name,
        content: `
          <p>Good news! The item you were waiting for is back in stock.</p>
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0;">${product.name}</h3>
            <p style="margin: 10px 0;"><strong>Price:</strong> $${product.price.toFixed(2)}</p>
            <p style="margin: 0; color: #28a745; font-weight: 600;">✅ In Stock Now</p>
          </div>
          <p>Hurry, items sell out quickly!</p>
        `,
        buttonText: 'Buy Now',
        buttonUrl: `${process.env.FRONTEND_URL}/products/${product.id}`
      }
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

// Start processing failed emails periodically
setInterval(() => {
  emailService.processFailedEmails().catch(err => {
    logger.error('Error processing failed emails:', err);
  });
}, 3600000); // Every hour

module.exports = emailService;