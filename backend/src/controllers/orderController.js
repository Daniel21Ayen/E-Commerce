const { prisma } = require('../config/database');
const { logger } = require('../middleware/logger');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');
const { Helpers } = require('../utils/helpers');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');
const pdfService = require('../services/pdfService');

class OrderController {
  /**
   * Create new order
   */
  static async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const {
        shippingAddress,
        billingAddress,
        paymentMethod,
        notes,
        promoCode
      } = req.body;

      // Get cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Cart is empty',
          code: RESPONSE_CODES.ERROR
        });
      }

      // Check stock availability
      for (const item of cart.items) {
        const stockQuantity = item.variant 
          ? item.variant.stockQuantity 
          : item.product.stockQuantity;

        if (stockQuantity < item.quantity) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: `Insufficient stock for ${item.product.name}`,
            code: RESPONSE_CODES.ERROR
          });
        }
      }

      // Calculate totals
      const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = cart.discountAmount || 0;
      const tax = subtotal * 0.08; // 8% tax
      const shipping = subtotal > 50 ? 0 : 5.99;
      const total = subtotal - discount + tax + shipping;

      // Generate order number
      const orderNumber = Helpers.generateOrderNumber();

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod,
          subtotal,
          discountAmount: discount,
          taxAmount: tax,
          shippingAmount: shipping,
          totalAmount: total,
          shippingAddress,
          billingAddress: billingAddress || shippingAddress,
          notes,
          promoCodeId: cart.promoCodeId,
          promoDiscount: discount,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              productSku: item.product.sku,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.totalPrice,
              attributes: item.attributes || null
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      // Update inventory
      for (const item of cart.items) {
        if (item.variant) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              }
            }
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              },
              salesCount: {
                increment: item.quantity
              }
            }
          });
        }

        // Create inventory log
        await prisma.inventory.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            quantityChange: -item.quantity,
            previousQuantity: item.variant 
              ? item.variant.stockQuantity 
              : item.product.stockQuantity,
            newQuantity: (item.variant 
              ? item.variant.stockQuantity 
              : item.product.stockQuantity) - item.quantity,
            reason: 'sale',
            referenceType: 'order',
            referenceId: order.id,
            createdBy: userId
          }
        });
      }

      // Process payment
      const paymentResult = await paymentService.processPayment(
        order,
        {
          paymentMethod,
          ...req.body.paymentDetails
        }
      );

      if (!paymentResult.success) {
        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'failed',
            paymentStatus: 'failed'
          }
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Payment failed',
          error: paymentResult.error,
          code: RESPONSE_CODES.PAYMENT_ERROR
        });
      }

      // Update order with payment info
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          paymentTransactionId: paymentResult.transaction.transactionId,
          status: 'processing'
        }
      });

      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          totalItems: 0,
          totalPrice: 0,
          finalPrice: 0,
          discountAmount: 0,
          promoCodeId: null
        }
      });

      // Record promo code usage
      if (cart.promoCodeId) {
        await prisma.promoCodeUsage.create({
          data: {
            promoCodeId: cart.promoCodeId,
            userId,
            orderId: order.id,
            discountAmount: discount
          }
        });

        // Increment promo code usage count
        await prisma.promoCode.update({
          where: { id: cart.promoCodeId },
          data: {
            usageCount: { increment: 1 }
          }
        });
      }

      // Send order confirmation email
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      await emailService.sendOrderConfirmation(order, user);

      // Generate PDF invoice
      const pdfResult = await pdfService.generateInvoice(order, user);

      logger.info('Order created', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId,
        total: order.totalAmount
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        message: 'Order created successfully',
        data: {
          order,
          payment: paymentResult,
          invoice: pdfResult
        }
      });
    } catch (error) {
      logger.error('Create order error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to create order',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get user orders
   */
  static async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = { userId };
      if (status) {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: {
                      where: { isPrimary: true },
                      take: 1
                    }
                  }
                }
              }
            },
            tracking: {
              orderBy: { timestamp: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.order.count({ where })
      ]);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get orders error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get orders',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get single order
   */
  static async getOrder(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              },
              variant: true
            }
          },
          tracking: {
            orderBy: { timestamp: 'desc' }
          },
          payments: true,
          promoCode: true
        }
      });

      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Order not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: order
      });
    } catch (error) {
      logger.error('Get order error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get order',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { reason } = req.body;

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId,
          status: {
            in: ['pending', 'processing']
          }
        },
        include: {
          items: true
        }
      });

      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Order not found or cannot be cancelled',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Update order status
      await prisma.order.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledBy: userId,
          updatedAt: new Date()
        }
      });

      // Restore inventory
      for (const item of order.items) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                increment: item.quantity
              }
            }
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity
              },
              salesCount: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      // Send cancellation email
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      await emailService.sendOrderStatusUpdate(order, user, 'cancelled', order.status);

      logger.info('Order cancelled', {
        orderId: id,
        userId,
        reason
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      logger.error('Cancel order error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to cancel order',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Track order
   */
  static async trackOrder(req, res) {
    try {
      const { id } = req.params;

      const tracking = await prisma.orderTracking.findMany({
        where: { orderId: id },
        orderBy: { timestamp: 'asc' }
      });

      if (!tracking || tracking.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'No tracking information found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: tracking
      });
    } catch (error) {
      logger.error('Track order error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to track order',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Download invoice PDF
   */
  static async downloadInvoice(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Order not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      const pdf = await pdfService.generateInvoice(order, user);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: pdf
      });
    } catch (error) {
      logger.error('Download invoice error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to generate invoice',
        code: RESPONSE_CODES.ERROR
      });
    }
  }
}

module.exports = OrderController;