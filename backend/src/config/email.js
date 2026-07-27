const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const { logger } = require('../middleware/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.templates = {};
    this.loadTemplates();
  }

  // Load email templates
  loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      // Create templates directory if it doesn't exist
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }

      // Common templates
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
        'payment-receipt': 'payment-receipt.html'
      };

      // Load each template
      for (const [name, file] of Object.entries(templateFiles)) {
        const templatePath = path.join(templatesDir, file);
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          this.templates[name] = handlebars.compile(templateContent);
          logger.info(`Loaded email template: ${name}`);
        } else {
          // Create default template if not exists
          this.createDefaultTemplate(templatePath, name);
        }
      }
    } catch (error) {
      logger.error('Error loading email templates:', error);
    }
  }

  // Create default template
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

  // Get default template HTML
  getDefaultTemplate(type) {
    const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        .logo { font-size: 24px; font-weight: bold; }
        .status { display: inline-block; padding: 5px 15px; background: #2196F3; color: white; border-radius: 20px; font-size: 14px; }
        .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🛍️ E-Commerce</div>
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
        <p>© 2024 E-Commerce. All rights reserved.</p>
        <p>You received this email because you are registered with us.</p>
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
      'payment-receipt': baseTemplate
    };

    return templates[type] || baseTemplate;
  }

  // Configure email transport
  configureTransporter() {
    try {
      const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
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
        rateLimit: 10 // messages per second
      };

      // Create transporter
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
      throw error;
    }
  }

  // Send email
  async sendEmail({ to, subject, template, data = {}, attachments = [], cc = [], bcc = [] }) {
    try {
      if (!this.isConfigured) {
        this.configureTransporter();
      }

      if (!this.isConfigured) {
        throw new Error('Email service not configured');
      }

      // Compile template
      let html;
      if (template && this.templates[template]) {
        html = this.templates[template]({
          ...data,
          subject,
          name: data.name || 'Customer',
          email: to
        });
      } else {
        // Fallback to plain text
        html = `
          <h2>${subject}</h2>
          <p>Hello ${data.name || 'Customer'},</p>
          <p>${data.content || 'Please check your email for more details.'}</p>
        `;
      }

      // Email options
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ecommerce.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        attachments,
        cc: cc.length ? cc.join(', ') : undefined,
        bcc: bcc.length ? bcc.join(', ') : undefined,
        headers: {
          'X-Priority': '1',
          'X-Mailer': 'E-Commerce App',
          'List-Unsubscribe': `<mailto:unsubscribe@ecommerce.com>`
        },
        trackingId: data.trackingId || null
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${to} with subject: "${subject}"`);
      logger.debug(`Email info: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      };

    } catch (error) {
      logger.error('Error sending email:', error.message);
      logger.error('Error details:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to E-Commerce! 🎉',
      template: 'welcome',
      data: {
        name: user.name,
        content: `
          <p>We're excited to have you on board! Your account has been successfully created.</p>
          <p>You can now start shopping and explore our wide range of products.</p>
          <p>To get started, check out our latest deals and exclusive offers.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>Browse our product catalog</li>
            <li>Add items to your wishlist</li>
            <li>Create and manage your orders</li>
          </ul>
        `,
        buttonText: 'Start Shopping',
        buttonUrl: `${process.env.FRONTEND_URL}/products`
      }
    });
  }

  // Send order confirmation email
  async sendOrderConfirmation(order, user) {
    const orderItems = order.items.map(item => 
      `${item.productName} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('<br>');

    return this.sendEmail({
      to: user.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      template: 'order-confirmation',
      data: {
        name: user.name,
        orderNumber: order.orderNumber,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        orderTotal: `$${order.totalAmount.toFixed(2)}`,
        orderItems: orderItems,
        shippingAddress: order.shippingAddress,
        content: `
          <div class="order-details">
            <h3>Order Summary</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <hr>
            <h4>Items Ordered:</h4>
            ${orderItems}
            <hr>
            <h4>Shipping Address:</h4>
            <p>${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}</p>
          </div>
          ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>` : ''}
        `,
        buttonText: 'View Order',
        buttonUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`
      }
    });
  }

  // Send order status update email
  async sendOrderStatusUpdate(order, user, status, previousStatus) {
    const statusMessages = {
      'processing': 'Your order is being processed and prepared for shipment.',
      'shipped': 'Your order has been shipped! Check the tracking details below.',
      'delivered': 'Your order has been delivered! We hope you enjoy your purchase.',
      'cancelled': 'Your order has been cancelled.',
      'refunded': 'Your order has been refunded.'
    };

    return this.sendEmail({
      to: user.email,
      subject: `Order ${order.orderNumber} Status Update: ${status.toUpperCase()}`,
      template: 'order-status',
      data: {
        name: user.name,
        orderNumber: order.orderNumber,
        status: status,
        content: `
          <div class="status">${status.toUpperCase()}</div>
          <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          ${order.trackingCarrier ? `<p><strong>Carrier:</strong> ${order.trackingCarrier}</p>` : ''}
          ${order.trackingUrl ? `<p><a href="${order.trackingUrl}" target="_blank">Track your package</a></p>` : ''}
          ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>` : ''}
        `,
        buttonText: 'Track Order',
        buttonUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`
      }
    });
  }

  // Send password reset email
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
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        `,
        buttonText: 'Reset Password',
        buttonUrl: resetUrl
      }
    });
  }

  // Send abandoned cart email
  async sendAbandonedCartEmail(user, cartItems, cartTotal) {
    const itemsList = cartItems.map(item => 
      `${item.productName} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('<br>');

    return this.sendEmail({
      to: user.email,
      subject: 'Don\'t Forget Your Cart! 🛒',
      template: 'abandoned-cart',
      data: {
        name: user.name,
        content: `
          <p>You left some items in your cart. Don't miss out on these great deals!</p>
          <div class="order-details">
            <h4>Items in your cart:</h4>
            ${itemsList}
            <hr>
            <p><strong>Cart Total:</strong> $${cartTotal.toFixed(2)}</p>
          </div>
          <p>Complete your purchase now and get free shipping on orders over $50!</p>
        `,
        buttonText: 'Complete Your Purchase',
        buttonUrl: `${process.env.FRONTEND_URL}/cart`
      }
    });
  }

  // Send order tracking email
  async sendOrderTrackingEmail(order, user, trackingEvents) {
    const eventsList = trackingEvents.map(event => 
      `<li>${event.status} - ${event.description} (${new Date(event.timestamp).toLocaleString()})</li>`
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
          <ul>
            ${eventsList}
          </ul>
          ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>` : ''}
        `,
        buttonText: 'Track Order',
        buttonUrl: `${process.env.FRONTEND_URL}/order-tracking/${order.id}`
      }
    });
  }

  // Send promo code email
  async sendPromoCodeEmail(user, promoCode) {
    return this.sendEmail({
      to: user.email,
      subject: `Special Offer: ${promoCode.code}`,
      template: 'promo-code',
      data: {
        name: user.name,
        content: `
          <p>We have a special offer just for you!</p>
          <div class="order-details" style="text-align: center;">
            <h2 style="font-size: 32px; color: #4CAF50;">${promoCode.code}</h2>
            <p><strong>Save ${promoCode.discountType === 'percentage' ? promoCode.discountValue + '%' : '$' + promoCode.discountValue}</strong></p>
            ${promoCode.minPurchase ? `<p>Minimum Purchase: $${promoCode.minPurchase}</p>` : ''}
            ${promoCode.expiresAt ? `<p>Expires: ${new Date(promoCode.expiresAt).toLocaleDateString()}</p>` : ''}
          </div>
        `,
        buttonText: 'Shop Now',
        buttonUrl: process.env.FRONTEND_URL
      }
    });
  }

  // Send review request email
  async sendReviewRequestEmail(user, order, product) {
    return this.sendEmail({
      to: user.email,
      subject: `Review Your Purchase: ${product.name}`,
      template: 'review-request',
      data: {
        name: user.name,
        content: `
          <p>We hope you're enjoying your recent purchase! We'd love to hear your feedback.</p>
          <div class="order-details">
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Order:</strong> ${order.orderNumber}</p>
          </div>
          <p>Your review helps other customers make informed decisions and helps us improve our products.</p>
        `,
        buttonText: 'Write a Review',
        buttonUrl: `${process.env.FRONTEND_URL}/products/${product.id}/review`
      }
    });
  }

  // Send low stock alert email (admin)
  async sendLowStockAlert(products) {
    const productsList = products.map(p => 
      `<li>${p.name} - Stock: ${p.stockQuantity} (Threshold: ${p.lowStockThreshold})</li>`
    ).join('');

    return this.sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@ecommerce.com',
      subject: '⚠️ Low Stock Alert',
      template: 'low-stock',
      data: {
        name: 'Admin',
        content: `
          <p>The following products are running low on stock:</p>
          <ul>
            ${productsList}
          </ul>
          <p>Please restock these items as soon as possible.</p>
        `,
        buttonText: 'View Inventory',
        buttonUrl: `${process.env.FRONTEND_URL}/admin/inventory`
      }
    });
  }

  // Send payment receipt email
  async sendPaymentReceipt(order, user, payment) {
    return this.sendEmail({
      to: user.email,
      subject: `Payment Receipt #${payment.transactionId}`,
      template: 'payment-receipt',
      data: {
        name: user.name,
        content: `
          <div class="order-details">
            <h3>Payment Receipt</h3>
            <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
            <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
          </div>
        `,
        buttonText: 'Download Invoice',
        buttonUrl: `${process.env.FRONTEND_URL}/orders/${order.id}/invoice`
      }
    });
  }

  // Send bulk emails
  async sendBulkEmails(recipients, subject, template, data = {}) {
    const results = [];
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(recipient => 
        this.sendEmail({
          to: recipient.email,
          subject,
          template,
          data: { ...data, name: recipient.name }
        })
      );

      const batchResults = await Promise.allSettled(promises);
      results.push(...batchResults);

      // Delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      total: recipients.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      results
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;