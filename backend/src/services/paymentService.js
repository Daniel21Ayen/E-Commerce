const crypto = require('crypto');
const { logger } = require('../middleware/logger');
const { prisma } = require('../config/database');
const redisService = require('./redisService');

class PaymentService {
  constructor() {
    this.providers = {
      stripe: null,
      paypal: null,
      razorpay: null,
      mock: this.processMockPayment.bind(this)
    };
    this.defaultProvider = 'mock';
    this.initializeProviders();
  }

  /**
   * Initialize payment providers
   */
  initializeProviders() {
    try {
      // Initialize Stripe
      if (process.env.STRIPE_SECRET_KEY) {
        const Stripe = require('stripe');
        this.providers.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        logger.info('Stripe initialized');
      }

      // Initialize PayPal
      if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
        // PayPal initialization would go here
        logger.info('PayPal initialized');
      }

      // Initialize Razorpay
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const Razorpay = require('razorpay');
        this.providers.razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        logger.info('Razorpay initialized');
      }
    } catch (error) {
      logger.error('Error initializing payment providers:', error);
    }
  }

  /**
   * Process payment
   */
  async processPayment(order, paymentDetails, provider = null) {
    try {
      const providerName = provider || this.defaultProvider;
      const paymentProvider = this.providers[providerName];

      if (!paymentProvider) {
        throw new Error(`Payment provider ${providerName} not found`);
      }

      // Validate payment details
      this.validatePaymentDetails(paymentDetails);

      // Process payment based on provider
      let result;
      if (providerName === 'mock') {
        result = await paymentProvider(order, paymentDetails);
      } else if (providerName === 'stripe' && this.providers.stripe) {
        result = await this.processStripePayment(order, paymentDetails);
      } else if (providerName === 'razorpay' && this.providers.razorpay) {
        result = await this.processRazorpayPayment(order, paymentDetails);
      } else {
        throw new Error(`Payment provider ${providerName} not available`);
      }

      // Create payment transaction record
      const transaction = await this.createPaymentTransaction(order, result, providerName);

      // Update order payment status
      await this.updateOrderPaymentStatus(order.id, result);

      // Send notification
      await this.sendPaymentNotification(order, result);

      return {
        success: true,
        transaction,
        paymentResult: result
      };
    } catch (error) {
      logger.error('Payment processing error:', error);
      
      // Create failed transaction record
      await this.createFailedTransaction(order, error, provider);

      return {
        success: false,
        error: error.message,
        code: error.code || 'PAYMENT_ERROR'
      };
    }
  }

  /**
   * Process mock payment (for testing)
   */
  async processMockPayment(order, paymentDetails) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate mock payment
    if (paymentDetails.cardNumber === '4111111111111111') {
      return {
        success: true,
        transactionId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        amount: order.totalAmount,
        currency: order.currency || 'USD',
        status: 'completed',
        paymentMethod: paymentDetails.paymentMethod || 'credit_card',
        timestamp: new Date().toISOString(),
        mock: true
      };
    } else if (paymentDetails.cardNumber === '4000000000000002') {
      throw new Error('Card declined');
    } else if (paymentDetails.cardNumber === '4000000000009995') {
      throw new Error('Insufficient funds');
    } else {
      throw new Error('Invalid card number');
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(order, paymentDetails) {
    try {
      const stripe = this.providers.stripe;

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        currency: order.currency || 'usd',
        payment_method_types: ['card'],
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.userId
        }
      });

      // Confirm payment
      if (paymentDetails.paymentMethodId) {
        await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: paymentDetails.paymentMethodId
        });
      }

      return {
        success: true,
        transactionId: paymentIntent.id,
        amount: order.totalAmount,
        currency: order.currency || 'USD',
        status: paymentIntent.status,
        paymentMethod: 'stripe',
        clientSecret: paymentIntent.client_secret,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Stripe payment error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Process Razorpay payment
   */
  async processRazorpayPayment(order, paymentDetails) {
    try {
      const razorpay = this.providers.razorpay;

      // Create order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.totalAmount * 100),
        currency: order.currency || 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order.id
        }
      });

      // Verify payment
      if (paymentDetails.razorpayPaymentId) {
        // Verify payment signature
        const isValid = this.verifyRazorpaySignature(
          paymentDetails.razorpayPaymentId,
          paymentDetails.razorpayOrderId,
          paymentDetails.razorpaySignature
        );

        if (!isValid) {
          throw new Error('Invalid payment signature');
        }
      }

      return {
        success: true,
        transactionId: razorpayOrder.id,
        amount: order.totalAmount,
        currency: order.currency || 'INR',
        status: razorpayOrder.status,
        paymentMethod: 'razorpay',
        orderId: razorpayOrder.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Razorpay payment error:', error);
      throw new Error(`Razorpay payment failed: ${error.message}`);
    }
  }

  /**
   * Verify Razorpay signature
   */
  verifyRazorpaySignature(paymentId, orderId, signature) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  }

  /**
   * Validate payment details
   */
  validatePaymentDetails(details) {
    const { cardNumber, expiryMonth, expiryYear, cvv, paymentMethod } = details;

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      // Validate card number (Luhn algorithm)
      if (!this.validateCardNumber(cardNumber)) {
        throw new Error('Invalid card number');
      }

      // Validate expiry date
      if (!this.validateExpiryDate(expiryMonth, expiryYear)) {
        throw new Error('Card expired or invalid expiry date');
      }

      // Validate CVV
      if (!this.validateCVV(cvv)) {
        throw new Error('Invalid CVV');
      }
    } else if (paymentMethod === 'paypal') {
      if (!details.paypalEmail) {
        throw new Error('PayPal email is required');
      }
    } else if (paymentMethod === 'bank_transfer') {
      if (!details.bankAccount || !details.bankCode) {
        throw new Error('Bank account details are required');
      }
    }

    return true;
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') return false;
    const sanitized = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;

    let sum = 0;
    let alternate = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let n = parseInt(sanitized.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n = (n % 10) + 1;
      }
      sum += n;
      alternate = !alternate;
    }
    return (sum % 10 === 0);
  }

  /**
   * Validate expiry date
   */
  validateExpiryDate(month, year) {
    if (!month || !year) return false;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear() % 100;

    const expiryMonth = parseInt(month);
    const expiryYear = parseInt(year);

    if (expiryMonth < 1 || expiryMonth > 12) return false;
    if (expiryYear < currentYear) return false;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return false;

    return true;
  }

  /**
   * Validate CVV
   */
  validateCVV(cvv) {
    if (!cvv || typeof cvv !== 'string') return false;
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Create payment transaction record
   */
  async createPaymentTransaction(order, result, provider) {
    try {
      const transaction = await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: result.amount || order.totalAmount,
          currency: result.currency || order.currency || 'USD',
          paymentMethod: result.paymentMethod || provider,
          transactionId: result.transactionId || result.id,
          status: result.status || 'completed',
          paymentData: result,
          createdAt: new Date(result.timestamp || Date.now()),
          updatedAt: new Date()
        }
      });

      logger.info(`Payment transaction created: ${transaction.id}`);
      return transaction;
    } catch (error) {
      logger.error('Error creating payment transaction:', error);
      throw error;
    }
  }

  /**
   * Create failed transaction record
   */
  async createFailedTransaction(order, error, provider) {
    try {
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.totalAmount,
          currency: order.currency || 'USD',
          paymentMethod: provider || 'unknown',
          transactionId: `failed_${Date.now()}`,
          status: 'failed',
          errorMessage: error.message,
          paymentData: { error: error.message, code: error.code },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (err) {
      logger.error('Error creating failed transaction:', err);
    }
  }

  /**
   * Update order payment status
   */
  async updateOrderPaymentStatus(orderId, result) {
    try {
      const status = result.success ? 'paid' : 'failed';
      const transactionId = result.transactionId || result.id;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: status,
          paymentTransactionId: transactionId,
          updatedAt: new Date()
        }
      });

      logger.info(`Order ${orderId} payment status updated to ${status}`);
    } catch (error) {
      logger.error('Error updating order payment status:', error);
      throw error;
    }
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(order, result) {
    try {
      const emailService = require('./emailService');
      
      if (result.success) {
        // Send payment confirmation
        await emailService.sendPaymentReceipt(order, { id: order.userId }, result);
      }
    } catch (error) {
      logger.error('Error sending payment notification:', error);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId, amount, reason) {
    try {
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Process refund based on provider
      let refundResult;
      const provider = transaction.paymentMethod;

      if (provider === 'stripe' && this.providers.stripe) {
        refundResult = await this.refundStripePayment(transactionId, amount);
      } else if (provider === 'razorpay' && this.providers.razorpay) {
        refundResult = await this.refundRazorpayPayment(transactionId, amount);
      } else {
        // Mock refund
        refundResult = {
          success: true,
          refundId: `refund_${Date.now()}`,
          amount: amount || transaction.amount,
          status: 'completed',
          timestamp: new Date().toISOString()
        };
      }

      // Update transaction
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'refunded',
          refundAmount: amount || transaction.amount,
          refundReason: reason,
          refundDate: new Date()
        }
      });

      return refundResult;
    } catch (error) {
      logger.error('Refund error:', error);
      throw error;
    }
  }

  /**
   * Refund Stripe payment
   */
  async refundStripePayment(transactionId, amount) {
    try {
      const stripe = this.providers.stripe;
      const refund = await stripe.refunds.create({
        payment_intent: transactionId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Stripe refund error:', error);
      throw error;
    }
  }

  /**
   * Refund Razorpay payment
   */
  async refundRazorpayPayment(transactionId, amount) {
    try {
      const razorpay = this.providers.razorpay;
      const refund = await razorpay.payments.refund(transactionId, {
        amount: amount ? Math.round(amount * 100) : undefined
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Razorpay refund error:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId) {
    try {
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { transactionId }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };
    } catch (error) {
      logger.error('Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, status } = options;

      const where = { userId };
      if (status) {
        where.status = status;
      }

      const transactions = await prisma.paymentTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.paymentTransaction.count({ where });

      return {
        transactions,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Webhook handler
   */
  async handleWebhook(payload, signature, provider) {
    try {
      if (provider === 'stripe') {
        return this.handleStripeWebhook(payload, signature);
      } else if (provider === 'razorpay') {
        return this.handleRazorpayWebhook(payload);
      } else {
        throw new Error('Unknown webhook provider');
      }
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(payload, signature) {
    const stripe = this.providers.stripe;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Process event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object);
        break;
      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true, type: event.type };
  }

  /**
   * Handle Razorpay webhook
   */
  async handleRazorpayWebhook(payload) {
    // Verify webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = payload.signature;
    const body = JSON.stringify(payload);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Webhook signature verification failed');
    }

    // Process event
    const event = payload.event;
    const data = payload.payload;

    switch (event) {
      case 'payment.authorized':
        await this.handleRazorpayPaymentAuthorized(data);
        break;
      case 'payment.captured':
        await this.handleRazorpayPaymentCaptured(data);
        break;
      case 'payment.failed':
        await this.handleRazorpayPaymentFailed(data);
        break;
      default:
        logger.info(`Unhandled Razorpay webhook event: ${event}`);
    }

    return { received: true, type: event };
  }

  /**
   * Handle payment success
   */
  async handlePaymentSuccess(data) {
    const orderId = data.metadata?.orderId;
    if (orderId) {
      await this.updateOrderPaymentStatus(orderId, {
        success: true,
        transactionId: data.id
      });
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(data) {
    // Log payment failure
    logger.error('Payment failed:', {
      paymentIntentId: data.id,
      error: data.last_payment_error?.message
    });
  }

  /**
   * Handle payment canceled
   */
  async handlePaymentCanceled(data) {
    const orderId = data.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          paymentStatus: 'failed',
          status: 'cancelled'
        }
      });
    }
  }

  /**
   * Handle Razorpay payment authorized
   */
  async handleRazorpayPaymentAuthorized(data) {
    // Payment authorized, wait for capture
    logger.info('Razorpay payment authorized:', data.payment);
  }

  /**
   * Handle Razorpay payment captured
   */
  async handleRazorpayPaymentCaptured(data) {
    const orderId = data.payment.notes?.orderId;
    if (orderId) {
      await this.updateOrderPaymentStatus(orderId, {
        success: true,
        transactionId: data.payment.id
      });
    }
  }

  /**
   * Handle Razorpay payment failed
   */
  async handleRazorpayPaymentFailed(data) {
    logger.error('Razorpay payment failed:', data.payment);
  }
}

// Create singleton instance
const paymentService = new PaymentService();

module.exports = paymentService;