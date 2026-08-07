const { prisma } = require('../config/database');
const { logger } = require('../middleware/logger');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');

class CartController {
  /**
   * Get user's cart
   */
  static async getCart(req, res) {
    try {
      const userId = req.user.id;

      let cart = await prisma.cart.findUnique({
        where: { userId },
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
          }
        }
      });

      if (!cart) {
        // Create empty cart
        cart = await prisma.cart.create({
          data: { userId },
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
            }
          }
        });
      }

      // Calculate totals
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = cart.discountAmount || 0;
      const total = subtotal - discount;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          ...cart,
          totalItems,
          subtotal,
          total,
          discount
        }
      });
    } catch (error) {
      logger.error('Get cart error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get cart',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { productId, variantId, quantity = 1 } = req.body;

      // Check product
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,
          deletedAt: null
        },
        include: {
          variants: true
        }
      });

      if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Product not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check variant if provided
      let variant = null;
      let price = product.price;
      let stockQuantity = product.stockQuantity;

      if (variantId) {
        variant = await prisma.productVariant.findFirst({
          where: {
            id: variantId,
            isActive: true
          }
        });

        if (!variant) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            status: 'error',
            message: 'Product variant not found',
            code: RESPONSE_CODES.NOT_FOUND
          });
        }

        price = variant.price;
        stockQuantity = variant.stockQuantity;
      }

      // Check stock
      if (stockQuantity < quantity) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Insufficient stock',
          code: RESPONSE_CODES.ERROR
        });
      }

      // Get or create cart
      let cart = await prisma.cart.findUnique({
        where: { userId }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId }
        });
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: variantId || null
        }
      });

      let cartItem;
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;

        // Check stock
        if (stockQuantity < newQuantity) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'Insufficient stock',
            code: RESPONSE_CODES.ERROR
          });
        }

        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            totalPrice: price * newQuantity,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new item
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            quantity,
            price,
            totalPrice: price * quantity,
            attributes: variant?.attributes || null
          }
        });
      }

      // Update cart totals
      await this.updateCartTotals(cart.id);

      logger.info('Item added to cart', {
        userId,
        productId,
        variantId,
        quantity,
        cartItemId: cartItem.id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Item added to cart',
        data: cartItem
      });
    } catch (error) {
      logger.error('Add to cart error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to add item to cart',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { quantity } = req.body;

      // Get cart item
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: { userId }
        },
        include: {
          product: true,
          variant: true
        }
      });

      if (!cartItem) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Cart item not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check stock
      const stockQuantity = cartItem.variant
        ? cartItem.variant.stockQuantity
        : cartItem.product.stockQuantity;

      if (stockQuantity < quantity) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Insufficient stock',
          code: RESPONSE_CODES.ERROR
        });
      }

      // Update item
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          totalPrice: cartItem.price * quantity,
          updatedAt: new Date()
        }
      });

      // Update cart totals
      await this.updateCartTotals(cartItem.cartId);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Cart item updated',
        data: updatedItem
      });
    } catch (error) {
      logger.error('Update cart item error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update cart item',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      // Get cart item
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: { userId }
        }
      });

      if (!cartItem) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Cart item not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Delete item
      await prisma.cartItem.delete({
        where: { id: itemId }
      });

      // Update cart totals
      await this.updateCartTotals(cartItem.cartId);

      logger.info('Item removed from cart', {
        userId,
        itemId
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Item removed from cart'
      });
    } catch (error) {
      logger.error('Remove from cart error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to remove item from cart',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Clear cart
   */
  static async clearCart(req, res) {
    try {
      const userId = req.user.id;

      const cart = await prisma.cart.findUnique({
        where: { userId }
      });

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });

        await this.updateCartTotals(cart.id);
      }

      logger.info('Cart cleared', { userId });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      logger.error('Clear cart error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to clear cart',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Apply promo code to cart
   */
  static async applyPromoCode(req, res) {
    try {
      const userId = req.user.id;
      const { code } = req.body;

      // Find promo code
      const promoCode = await prisma.promoCode.findFirst({
        where: {
          code: code.toUpperCase(),
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
          AND: [
            { startsAt: null },
            { startsAt: { lte: new Date() } }
          ]
        }
      });

      if (!promoCode) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Invalid or expired promo code',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check usage limit
      if (promoCode.usageLimit) {
        const usageCount = await prisma.promoCodeUsage.count({
          where: { promoCodeId: promoCode.id }
        });

        if (usageCount >= promoCode.usageLimit) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'Promo code usage limit exceeded',
            code: RESPONSE_CODES.ERROR
          });
        }
      }

      // Check per-user limit
      if (promoCode.perUserLimit > 0) {
        const userUsage = await prisma.promoCodeUsage.count({
          where: {
            promoCodeId: promoCode.id,
            userId
          }
        });

        if (userUsage >= promoCode.perUserLimit) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'You have already used this promo code',
            code: RESPONSE_CODES.ERROR
          });
        }
      }

      // Get cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: true
        }
      });

      if (!cart) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Cart not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Calculate discount
      const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Check minimum purchase
      if (promoCode.minPurchase > 0 && subtotal < promoCode.minPurchase) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: `Minimum purchase of $${promoCode.minPurchase} required`,
          code: RESPONSE_CODES.ERROR
        });
      }

      let discount = 0;
      if (promoCode.discountType === 'percentage') {
        discount = (subtotal * promoCode.discountValue) / 100;
        if (promoCode.maxDiscount && discount > promoCode.maxDiscount) {
          discount = promoCode.maxDiscount;
        }
      } else {
        discount = promoCode.discountValue;
        if (discount > subtotal) {
          discount = subtotal;
        }
      }

      // Update cart with promo code
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          promoCodeId: promoCode.id,
          discountAmount: discount,
          finalPrice: subtotal - discount,
          updatedAt: new Date()
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Promo code applied',
        data: {
          code: promoCode.code,
          discount,
          subtotal,
          total: subtotal - discount
        }
      });
    } catch (error) {
      logger.error('Apply promo code error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to apply promo code',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Remove promo code from cart
   */
  static async removePromoCode(req, res) {
    try {
      const userId = req.user.id;

      const cart = await prisma.cart.findUnique({
        where: { userId }
      });

      if (!cart) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Cart not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          promoCodeId: null,
          discountAmount: 0,
          finalPrice: cart.totalPrice,
          updatedAt: new Date()
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Promo code removed'
      });
    } catch (error) {
      logger.error('Remove promo code error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to remove promo code',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update cart totals
   */
  static async updateCartTotals(cartId) {
    try {
      const items = await prisma.cartItem.findMany({
        where: { cartId }
      });

      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Get promo code discount if applied
      const cart = await prisma.cart.findUnique({
        where: { id: cartId }
      });

      const discount = cart?.discountAmount || 0;
      const finalPrice = totalPrice - discount;

      await prisma.cart.update({
        where: { id: cartId },
        data: {
          totalItems,
          totalPrice,
          finalPrice,
          updatedAt: new Date()
        }
      });

      return { totalItems, totalPrice, finalPrice };
    } catch (error) {
      logger.error('Update cart totals error:', error);
      throw error;
    }
  }
}

module.exports = CartController;
