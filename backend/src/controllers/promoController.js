/**
 * Promo Code Controller
 * Handles promo code management and validation
 */

const { prisma } = require('../config/database');
const { logger } = require('../middleware/logger');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');
const cacheService = require('../services/cacheService');

class PromoController {
  /**
   * Validate promo code
   */
  static async validatePromoCode(req, res) {
    try {
      const { code, subtotal = 0, userId, productIds = [] } = req.body;

      if (!code) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Promo code is required',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      // Find promo code
      const promoCode = await prisma.promoCode.findFirst({
        where: {
          code: code.toUpperCase(),
          isActive: true,
          OR: [
            { startsAt: null },
            { startsAt: { lte: new Date() } }
          ],
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      });

      if (!promoCode) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Invalid or expired promo code',
          code: RESPONSE_CODES.NOT_FOUND,
          valid: false
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
            code: RESPONSE_CODES.ERROR,
            valid: false
          });
        }
      }

      // Check per-user limit
      if (promoCode.perUserLimit > 0 && userId) {
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
            code: RESPONSE_CODES.ERROR,
            valid: false
          });
        }
      }

      // Check minimum purchase
      if (promoCode.minPurchase > 0 && subtotal < promoCode.minPurchase) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: `Minimum purchase of $${promoCode.minPurchase} required`,
          code: RESPONSE_CODES.ERROR,
          valid: false
        });
      }

      // Check applicable products
      if (promoCode.applicableProducts && promoCode.applicableProducts.length > 0) {
        const applicable = promoCode.applicableProducts.some(id => productIds.includes(id));
        if (!applicable) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'This promo code does not apply to selected products',
            code: RESPONSE_CODES.ERROR,
            valid: false
          });
        }
      }

      // Check excluded products
      if (promoCode.excludedProducts && promoCode.excludedProducts.length > 0) {
        const excluded = promoCode.excludedProducts.some(id => productIds.includes(id));
        if (excluded) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'This promo code does not apply to selected products',
            code: RESPONSE_CODES.ERROR,
            valid: false
          });
        }
      }

      // Calculate discount
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

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        valid: true,
        data: {
          id: promoCode.id,
          code: promoCode.code,
          description: promoCode.description,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          discountAmount: discount,
          minPurchase: promoCode.minPurchase,
          maxDiscount: promoCode.maxDiscount,
          expiresAt: promoCode.expiresAt,
          isActive: promoCode.isActive
        }
      });
    } catch (error) {
      logger.error('Validate promo code error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to validate promo code',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get all promo codes (admin)
   */
  static async getAllPromoCodes(req, res) {
    try {
      const { page = 1, limit = 20, search, isActive } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const [promoCodes, total] = await Promise.all([
        prisma.promoCode.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                usages: true,
                orders: {
                  where: {
                    status: { in: ['processing', 'shipped', 'delivered'] }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.promoCode.count({ where })
      ]);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: promoCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get promo codes error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get promo codes',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Create promo code (admin)
   */
  static async createPromoCode(req, res) {
    try {
      const {
        code,
        description,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount,
        usageLimit,
        perUserLimit,
        startsAt,
        expiresAt,
        applicableProducts,
        applicableCategories,
        excludedProducts
      } = req.body;

      // Check if code already exists
      const existing = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (existing) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          message: 'Promo code already exists',
          code: RESPONSE_CODES.CONFLICT
        });
      }

      // Create promo code
      const promoCode = await prisma.promoCode.create({
        data: {
          code: code.toUpperCase(),
          description,
          discountType,
          discountValue: parseFloat(discountValue),
          minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
          maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
          startsAt: startsAt ? new Date(startsAt) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          applicableProducts: applicableProducts || null,
          applicableCategories: applicableCategories || null,
          excludedProducts: excludedProducts || null,
          createdBy: req.user.id
        }
      });

      logger.info('Promo code created', {
        adminId: req.user.id,
        promoCodeId: promoCode.id,
        code: promoCode.code
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        message: 'Promo code created successfully',
        data: promoCode
      });
    } catch (error) {
      logger.error('Create promo code error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to create promo code',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update promo code (admin)
   */
  static async updatePromoCode(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if promo code exists
      const promoCode = await prisma.promoCode.findUnique({
        where: { id }
      });

      if (!promoCode) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Promo code not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // If code is being updated, check uniqueness
      if (updates.code && updates.code !== promoCode.code) {
        const existing = await prisma.promoCode.findUnique({
          where: { code: updates.code.toUpperCase() }
        });

        if (existing) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            status: 'error',
            message: 'Promo code already exists',
            code: RESPONSE_CODES.CONFLICT
          });
        }
        updates.code = updates.code.toUpperCase();
      }

      // Update promo code
      const updatedPromoCode = await prisma.promoCode.update({
        where: { id },
        data: {
          ...updates,
          ...(updates.discountValue && { discountValue: parseFloat(updates.discountValue) }),
          ...(updates.minPurchase !== undefined && { minPurchase: parseFloat(updates.minPurchase) || 0 }),
          ...(updates.maxDiscount !== undefined && { maxDiscount: updates.maxDiscount ? parseFloat(updates.maxDiscount) : null }),
          ...(updates.usageLimit !== undefined && { usageLimit: updates.usageLimit ? parseInt(updates.usageLimit) : null }),
          ...(updates.perUserLimit !== undefined && { perUserLimit: parseInt(updates.perUserLimit) || 1 }),
          ...(updates.startsAt && { startsAt: new Date(updates.startsAt) }),
          ...(updates.expiresAt && { expiresAt: new Date(updates.expiresAt) })
        }
      });

      logger.info('Promo code updated', {
        adminId: req.user.id,
        promoCodeId: id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Promo code updated successfully',
        data: updatedPromoCode
      });
    } catch (error) {
      logger.error('Update promo code error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update promo code',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Delete promo code (admin)
   */
  static async deletePromoCode(req, res) {
    try {
      const { id } = req.params;

      const promoCode = await prisma.promoCode.findUnique({
        where: { id }
      });

      if (!promoCode) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Promo code not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Check if promo code has been used
      const usageCount = await prisma.promoCodeUsage.count({
        where: { promoCodeId: id }
      });

      if (usageCount > 0) {
        // Soft delete (mark as inactive)
        await prisma.promoCode.update({
          where: { id },
          data: { isActive: false }
        });

        return res.status(HTTP_STATUS.OK).json({
          status: 'success',
          message: 'Promo code deactivated (has been used)'
        });
      }

      // Hard delete
      await prisma.promoCode.delete({
        where: { id }
      });

      logger.info('Promo code deleted', {
        adminId: req.user.id,
        promoCodeId: id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Promo code deleted successfully'
      });
    } catch (error) {
      logger.error('Delete promo code error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to delete promo code',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Toggle promo code status (admin)
   */
  static async togglePromoCode(req, res) {
    try {
      const { id } = req.params;

      const promoCode = await prisma.promoCode.findUnique({
        where: { id }
      });

      if (!promoCode) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Promo code not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const updated = await prisma.promoCode.update({
        where: { id },
        data: {
          isActive: !promoCode.isActive
        }
      });

      logger.info('Promo code toggled', {
        adminId: req.user.id,
        promoCodeId: id,
        isActive: updated.isActive
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: `Promo code ${updated.isActive ? 'activated' : 'deactivated'}`,
        data: updated
      });
    } catch (error) {
      logger.error('Toggle promo code error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to toggle promo code',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get promo code usage statistics
   */
  static async getPromoCodeStats(req, res) {
    try {
      const { id } = req.params;

      const promoCode = await prisma.promoCode.findUnique({
        where: { id }
      });

      if (!promoCode) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Promo code not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const [totalUsage, totalDiscount, recentUsage] = await Promise.all([
        prisma.promoCodeUsage.count({
          where: { promoCodeId: id }
        }),
        prisma.promoCodeUsage.aggregate({
          where: { promoCodeId: id },
          _sum: {
            discountAmount: true
          }
        }),
        prisma.promoCodeUsage.findMany({
          where: { promoCodeId: id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                totalAmount: true,
                createdAt: true
              }
            }
          },
          orderBy: { usedAt: 'desc' },
          take: 20
        })
      ]);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          promoCode,
          stats: {
            totalUsage,
            totalDiscount: totalDiscount._sum.discountAmount || 0,
            remainingUses: promoCode.usageLimit ? promoCode.usageLimit - totalUsage : null
          },
          recentUsage
        }
      });
    } catch (error) {
      logger.error('Get promo code stats error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get promo code statistics',
        code: RESPONSE_CODES.ERROR
      });
    }
  }
}

module.exports = PromoController;