/**
 * Review Controller
 * Handles product reviews with likes and moderation
 */

const { prisma } = require('../config/database');
const { logger } = require('../middleware/logger');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');
const { Helpers } = require('../utils/helpers');
const cacheService = require('../services/cacheService');

class ReviewController {
  /**
   * Get product reviews
   */
  static async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        rating, 
        sortBy = 'createdAt',
        sortOrder = 'desc',
        onlyVerified = false
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {
        productId,
        isApproved: true
      };

      if (rating) {
        where.rating = parseInt(rating);
      }

      if (onlyVerified === 'true') {
        where.isVerifiedPurchase = true;
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: { avatarUrl: true }
                }
              }
            },
            images: true,
            _count: {
              select: {
                likes: {
                  where: { isLike: true }
                }
              }
            },
            likes: {
              where: {
                userId: req.user?.id || ''
              },
              take: 1
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take
        }),
        prisma.review.count({ where })
      ]);

      // Get rating summary
      const ratingSummary = await prisma.review.groupBy({
        by: ['rating'],
        where: {
          productId,
          isApproved: true
        },
        _count: true
      });

      // Get average rating
      const avgRating = await prisma.review.aggregate({
        where: {
          productId,
          isApproved: true
        },
        _avg: {
          rating: true
        }
      });

      // Format reviews with user like status
      const formattedReviews = reviews.map(review => ({
        ...review,
        userLiked: review.likes.length > 0,
        likesCount: review._count.likes,
        _count: undefined,
        likes: undefined
      }));

      // Build rating distribution
      const distribution = {};
      ratingSummary.forEach(item => {
        distribution[item.rating] = item._count;
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          reviews: formattedReviews,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          summary: {
            averageRating: avgRating._avg.rating || 0,
            totalReviews: total,
            distribution
          }
        }
      });
    } catch (error) {
      logger.error('Get product reviews error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get reviews',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get single review
   */
  static async getReview(req, res) {
    try {
      const { id } = req.params;

      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { avatarUrl: true }
              }
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          images: true,
          _count: {
            select: {
              likes: {
                where: { isLike: true }
              }
            }
          }
        }
      });

      if (!review) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Review not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check if user liked
      let userLiked = false;
      if (req.user) {
        const like = await prisma.reviewLike.findUnique({
          where: {
            reviewId_userId: {
              reviewId: id,
              userId: req.user.id
            }
          }
        });
        userLiked = like?.isLike || false;
      }

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          ...review,
          userLiked,
          likesCount: review._count.likes,
          _count: undefined
        }
      });
    } catch (error) {
      logger.error('Get review error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get review',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Create review
   */
  static async createReview(req, res) {
    try {
      const userId = req.user.id;
      const { productId, rating, title, description, images } = req.body;

      // Check if user has purchased this product
      const hasPurchased = await prisma.order.findFirst({
        where: {
          userId,
          status: 'delivered',
          items: {
            some: {
              productId
            }
          }
        }
      });

      // Check if user already reviewed this product
      const existingReview = await prisma.review.findUnique({
        where: {
          productId_userId: {
            productId,
            userId
          }
        }
      });

      if (existingReview) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          message: 'You have already reviewed this product',
          code: RESPONSE_CODES.CONFLICT
        });
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          productId,
          userId,
          rating: parseInt(rating),
          title,
          description,
          isVerifiedPurchase: !!hasPurchased,
          isApproved: false, // Requires moderation
          images: images ? {
            create: images.map(url => ({
              imageUrl: url
            }))
          } : undefined
        },
        include: {
          images: true
        }
      });

      // Update product rating
      await this.updateProductRating(productId);

      // Clear cache
      await cacheService.clearProductCache(productId);

      logger.info('Review created', {
        userId,
        productId,
        reviewId: review.id,
        rating
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        message: 'Review submitted and awaiting moderation',
        data: review
      });
    } catch (error) {
      logger.error('Create review error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to create review',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update review
   */
  static async updateReview(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { rating, title, description } = req.body;

      // Check if review exists and belongs to user
      const review = await prisma.review.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!review) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Review not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check if review is approved (can't modify approved reviews)
      if (review.isApproved) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          status: 'error',
          message: 'Cannot modify approved reviews',
          code: RESPONSE_CODES.FORBIDDEN
        });
      }

      // Update review
      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          rating: rating ? parseInt(rating) : undefined,
          title: title || undefined,
          description: description || undefined
        },
        include: {
          images: true
        }
      });

      logger.info('Review updated', {
        userId,
        reviewId: id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Review updated successfully',
        data: updatedReview
      });
    } catch (error) {
      logger.error('Update review error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update review',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Delete review
   */
  static async deleteReview(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const review = await prisma.review.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { user: { role: 'admin' } }
          ]
        }
      });

      if (!review) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Review not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Delete images first
      await prisma.reviewImage.deleteMany({
        where: { reviewId: id }
      });

      // Delete likes
      await prisma.reviewLike.deleteMany({
        where: { reviewId: id }
      });

      // Delete review
      await prisma.review.delete({
        where: { id }
      });

      // Update product rating
      await this.updateProductRating(review.productId);

      // Clear cache
      await cacheService.clearProductCache(review.productId);

      logger.info('Review deleted', {
        userId,
        reviewId: id,
        productId: review.productId
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Review deleted successfully'
      });
    } catch (error) {
      logger.error('Delete review error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to delete review',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Like/unlike review
   */
  static async toggleLike(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { isLike = true } = req.body;

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Review not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check if user already liked/disliked
      const existingLike = await prisma.reviewLike.findUnique({
        where: {
          reviewId_userId: {
            reviewId: id,
            userId
          }
        }
      });

      let result;
      if (existingLike) {
        if (existingLike.isLike === isLike) {
          // Remove like (toggle off)
          await prisma.reviewLike.delete({
            where: {
              reviewId_userId: {
                reviewId: id,
                userId
              }
            }
          });
          result = { action: 'removed' };
        } else {
          // Update like status
          result = await prisma.reviewLike.update({
            where: {
              reviewId_userId: {
                reviewId: id,
                userId
              }
            },
            data: { isLike }
          });
          result = { action: 'updated', isLike };
        }
      } else {
        // Create new like
        result = await prisma.reviewLike.create({
          data: {
            reviewId: id,
            userId,
            isLike
          }
        });
        result = { action: 'created', isLike };
      }

      // Update helpful count
      const helpfulCount = await prisma.reviewLike.count({
        where: {
          reviewId: id,
          isLike: true
        }
      });

      const notHelpfulCount = await prisma.reviewLike.count({
        where: {
          reviewId: id,
          isLike: false
        }
      });

      await prisma.review.update({
        where: { id },
        data: {
          helpfulCount,
          notHelpfulCount
        }
      });

      logger.info('Review like toggled', {
        userId,
        reviewId: id,
        isLike,
        action: result.action
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          reviewId: id,
          isLike,
          action: result.action,
          helpfulCount,
          notHelpfulCount
        }
      });
    } catch (error) {
      logger.error('Toggle like error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to toggle like',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get user's reviews
   */
  static async getUserReviews(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            images: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.review.count({ where: { userId } })
      ]);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get user reviews error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get your reviews',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Admin: Get all reviews (moderation)
   */
  static async getAllReviews(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status = 'pending',
        rating,
        productId,
        userId,
        dateFrom,
        dateTo
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (status === 'pending') {
        where.isApproved = false;
      } else if (status === 'approved') {
        where.isApproved = true;
      } else if (status === 'all') {
        // No filter
      }

      if (rating) {
        where.rating = parseInt(rating);
      }

      if (productId) {
        where.productId = productId;
      }

      if (userId) {
        where.userId = userId;
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            images: true,
            _count: {
              select: {
                likes: {
                  where: { isLike: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.review.count({ where })
      ]);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get all reviews error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get reviews',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Admin: Moderate review (approve/reject)
   */
  static async moderateReview(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Review not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          isApproved: status === 'approved',
          updatedAt: new Date()
        }
      });

      // Update product rating
      await this.updateProductRating(review.productId);

      // Clear cache
      await cacheService.clearProductCache(review.productId);

      logger.info('Review moderated', {
        reviewId: id,
        status,
        adminId: req.user.id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: `Review ${status}`,
        data: updatedReview
      });
    } catch (error) {
      logger.error('Moderate review error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to moderate review',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Admin: Feature review
   */
  static async featureReview(req, res) {
    try {
      const { id } = req.params;
      const { featured = true } = req.body;

      const review = await prisma.review.findUnique({
        where: { id }
      });

      if (!review) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Review not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          isFeatured: featured,
          updatedAt: new Date()
        }
      });

      logger.info('Review featured toggled', {
        reviewId: id,
        featured,
        adminId: req.user.id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: featured ? 'Review featured' : 'Review unfeatured',
        data: updatedReview
      });
    } catch (error) {
      logger.error('Feature review error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to feature review',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Helper: Update product rating
   */
  static async updateProductRating(productId) {
    try {
      const result = await prisma.review.aggregate({
        where: {
          productId,
          isApproved: true
        },
        _avg: {
          rating: true
        },
        _count: true
      });

      await prisma.product.update({
        where: { id: productId },
        data: {
          averageRating: result._avg.rating || 0,
          totalReviews: result._count
        }
      });

      return true;
    } catch (error) {
      logger.error('Update product rating error:', error);
      return false;
    }
  }
}

module.exports = ReviewController;