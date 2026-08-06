/**
 * Wishlist Controller
 * Handles wishlist management with move-to-cart functionality
 */

const { prisma } = require('../config/database');
const { logger } = require('../middleware/logger');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');
const cartService = require('../services/cartService');

class WishlistController {
  /**
   * Get user's wishlist
   */
  static async getWishlist(req, res) {
    try {
      const userId = req.user.id;

      const wishlist = await prisma.wishlist.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              },
              _count: {
                select: {
                  reviews: {
                    where: { isApproved: true }
                  }
                }
              }
            }
          },
          variant: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Format response
      const formattedWishlist = wishlist.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        notes: item.notes,
        createdAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          comparePrice: item.product.comparePrice,
          stockQuantity: item.variant ? item.variant.stockQuantity : item.product.stockQuantity,
          averageRating: item.product.averageRating,
          totalReviews: item.product._count.reviews,
          image: item.product.images[0]?.imageUrl || null,
          category: item.product.category,
          hasVariants: item.product.variants?.length > 0 || false
        },
        variant: item.variant ? {
          id: item.variant.id,
          sku: item.variant.sku,
          attributes: item.variant.attributes,
          price: item.variant.price,
          stockQuantity: item.variant.stockQuantity
        } : null
      }));

      logger.info('Wishlist retrieved', {
        userId,
        count: formattedWishlist.length
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: formattedWishlist,
        count: formattedWishlist.length
      });
    } catch (error) {
      logger.error('Get wishlist error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get wishlist',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Add item to wishlist
   */
  static async addToWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { productId, variantId, notes } = req.body;

      // Check if product exists and is active
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          isActive: true,
          deletedAt: null
        },
        include: {
          variants: {
            where: { isActive: true }
          }
        }
      });

      if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Product not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // If variantId provided, verify it exists and belongs to product
      if (variantId) {
        const variant = await prisma.productVariant.findFirst({
          where: {
            id: variantId,
            productId: productId,
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
      }

// Check if already in wishlist
      const existing = await prisma.wishlist.findFirst({
        where: {
          userId,
          productId,
          variantId: variantId || null
        }
      });

      if (existing) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          message: 'Item already in wishlist',
          code: RESPONSE_CODES.CONFLICT
        });
      }

      // Add to wishlist
      const wishlistItem = await prisma.wishlist.create({
        data: {
          userId,
          productId,
          variantId: variantId || null,
          notes: notes || null
        },
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
      });

      logger.info('Item added to wishlist', {
        userId,
        productId,
        variantId,
        wishlistId: wishlistItem.id
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        message: 'Item added to wishlist',
        data: {
          id: wishlistItem.id,
          productId: wishlistItem.productId,
          variantId: wishlistItem.variantId,
          notes: wishlistItem.notes,
          createdAt: wishlistItem.createdAt,
          product: {
            id: wishlistItem.product.id,
            name: wishlistItem.product.name,
            price: wishlistItem.product.price,
            image: wishlistItem.product.images[0]?.imageUrl || null
          }
        }
      });
    } catch (error) {
      logger.error('Add to wishlist error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to add item to wishlist',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Remove item from wishlist
   */
  static async removeFromWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Check if item exists and belongs to user
      const wishlistItem = await prisma.wishlist.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!wishlistItem) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Wishlist item not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Remove from wishlist
      await prisma.wishlist.delete({
        where: { id }
      });

      logger.info('Item removed from wishlist', {
        userId,
        wishlistId: id,
        productId: wishlistItem.productId
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Item removed from wishlist'
      });
    } catch (error) {
      logger.error('Remove from wishlist error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to remove item from wishlist',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Move wishlist item to cart
   */
  static async moveToCart(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { quantity = 1 } = req.body;

      // Get wishlist item
      const wishlistItem = await prisma.wishlist.findFirst({
        where: {
          id,
          userId
        },
        include: {
          product: {
            include: {
              variants: {
                where: { isActive: true }
              }
            }
          },
          variant: true
        }
      });

      if (!wishlistItem) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Wishlist item not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check stock
      const stockQuantity = wishlistItem.variant 
        ? wishlistItem.variant.stockQuantity 
        : wishlistItem.product.stockQuantity;

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

      // Get product price
      const price = wishlistItem.variant 
        ? wishlistItem.variant.price 
        : wishlistItem.product.price;

      // Check if item already exists in cart
      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: wishlistItem.productId,
          variantId: wishlistItem.variantId || null
        }
      });

      let cartItem;
      if (existingCartItem) {
        // Update quantity
        const newQuantity = existingCartItem.quantity + quantity;
        
        if (stockQuantity < newQuantity) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'Insufficient stock',
            code: RESPONSE_CODES.ERROR
          });
        }

        cartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: newQuantity,
            totalPrice: price * newQuantity,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new cart item
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: wishlistItem.productId,
            variantId: wishlistItem.variantId || null,
            quantity,
            price,
            totalPrice: price * quantity,
            attributes: wishlistItem.variant?.attributes || null
          }
        });
      }

      // Update cart totals
      await cartService.updateCartTotals(cart.id);

      // Remove from wishlist
      await prisma.wishlist.delete({
        where: { id }
      });

      logger.info('Item moved from wishlist to cart', {
        userId,
        wishlistId: id,
        cartItemId: cartItem.id,
        quantity
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Item moved to cart',
        data: {
          cartItem,
          wishlistRemoved: true
        }
      });
    } catch (error) {
      logger.error('Move to cart error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to move item to cart',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Move all wishlist items to cart
   */
  static async moveAllToCart(req, res) {
    try {
      const userId = req.user.id;

      // Get all wishlist items
      const wishlistItems = await prisma.wishlist.findMany({
        where: { userId },
        include: {
          product: true,
          variant: true
        }
      });

      if (wishlistItems.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Wishlist is empty',
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

      let movedCount = 0;
      let failedItems = [];

      // Process each item
      for (const item of wishlistItems) {
        try {
          const stockQuantity = item.variant 
            ? item.variant.stockQuantity 
            : item.product.stockQuantity;

          if (stockQuantity < 1) {
            failedItems.push({
              productId: item.productId,
              reason: 'Out of stock'
            });
            continue;
          }

          const price = item.variant 
            ? item.variant.price 
            : item.product.price;

          // Check if already in cart
          const existingCartItem = await prisma.cartItem.findFirst({
            where: {
              cartId: cart.id,
              productId: item.productId,
              variantId: item.variantId || null
            }
          });

          if (existingCartItem) {
            const newQuantity = existingCartItem.quantity + 1;
            if (stockQuantity >= newQuantity) {
              await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: {
                  quantity: newQuantity,
                  totalPrice: price * newQuantity,
                  updatedAt: new Date()
                }
              });
              movedCount++;
            } else {
              failedItems.push({
                productId: item.productId,
                reason: 'Insufficient stock'
              });
            }
          } else {
            await prisma.cartItem.create({
              data: {
                cartId: cart.id,
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: 1,
                price,
                totalPrice: price,
                attributes: item.variant?.attributes || null
              }
            });
            movedCount++;
          }

          // Remove from wishlist
          await prisma.wishlist.delete({
            where: { id: item.id }
          });

        } catch (error) {
          logger.error('Failed to move wishlist item:', error);
          failedItems.push({
            productId: item.productId,
            reason: 'Error processing item'
          });
        }
      }

      // Update cart totals
      await cartService.updateCartTotals(cart.id);

      logger.info('Wishlist items moved to cart', {
        userId,
        movedCount,
        failedCount: failedItems.length
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: `${movedCount} items moved to cart${failedItems.length > 0 ? `, ${failedItems.length} items failed` : ''}`,
        data: {
          movedCount,
          failedCount: failedItems.length,
          failedItems
        }
      });
    } catch (error) {
      logger.error('Move all to cart error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to move items to cart',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Check if product is in wishlist
   */
  static async checkWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { productId, variantId } = req.query;

      if (!productId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Product ID is required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

const wishlistItem = await prisma.wishlist.findFirst({
        where: {
          userId,
          productId,
          variantId: variantId || null
        },
        select: {
          id: true
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          inWishlist: !!wishlistItem,
          wishlistId: wishlistItem?.id || null
        }
      });
    } catch (error) {
      logger.error('Check wishlist error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to check wishlist',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update wishlist item notes
   */
  static async updateNotes(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { notes } = req.body;

      const wishlistItem = await prisma.wishlist.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!wishlistItem) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Wishlist item not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const updated = await prisma.wishlist.update({
        where: { id },
        data: { notes }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Notes updated',
        data: {
          id: updated.id,
          notes: updated.notes
        }
      });
    } catch (error) {
      logger.error('Update wishlist notes error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update notes',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Clear wishlist
   */
  static async clearWishlist(req, res) {
    try {
      const userId = req.user.id;

      const result = await prisma.wishlist.deleteMany({
        where: { userId }
      });

      logger.info('Wishlist cleared', {
        userId,
        count: result.count
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: `Wishlist cleared (${result.count} items removed)`,
        data: {
          removedCount: result.count
        }
      });
    } catch (error) {
      logger.error('Clear wishlist error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to clear wishlist',
        code: RESPONSE_CODES.ERROR
      });
    }
  }
}

module.exports = WishlistController;