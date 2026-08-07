/**
 * Cart Service
 * Handles cart business logic
 */

const { prisma } = require('../config/database');
const logger = require('../middleware/logger');

class CartService {
  /**
   * Update cart totals
   */
  async updateCartTotals(cartId) {
    try {
      const cartItems = await prisma.cartItem.findMany({
        where: { cartId },
        include: {
          product: {
            select: {
              price: true
            }
          }
        }
      });

      const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

      // Get existing discount to compute final price
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        select: { discountAmount: true }
      });
      const discount = cart?.discountAmount || 0;
      const finalPrice = totalPrice - discount;

      await prisma.cart.update({
        where: { id: cartId },
        data: {
          totalPrice,
          totalItems,
          finalPrice,
          updatedAt: new Date()
        }
      });

      return { totalPrice, totalItems, finalPrice };
    } catch (error) {
      logger.error('Error updating cart totals:', error);
      throw error;
    }
  }

  /**
   * Get or create cart for user
   */
  async getOrCreateCart(userId) {
    try {
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

      return cart;
    } catch (error) {
      logger.error('Error getting or creating cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  async addItem(userId, productId, quantity = 1, variantId = null) {
    try {
      const cart = await this.getOrCreateCart(userId);

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, price: true, stockQuantity: true, isActive: true }
      });

      if (!product || !product.isActive) {
        throw new Error('Product not found or inactive');
      }

      let price = product.price;
      if (variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          select: { price: true, stockQuantity: true }
        });
        if (!variant) {
          throw new Error('Variant not found');
        }
        price = variant.price || price;
      }

      // Check if item already exists
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId
        }
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            totalPrice: price * newQuantity,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId,
            quantity,
            price,
            totalPrice: price * quantity
          }
        });
      }

      await this.updateCartTotals(cart.id);
      return this.getOrCreateCart(userId);
    } catch (error) {
      logger.error('Error adding item to cart:', error);
      throw error;
    }
  }
}

module.exports = new CartService();

