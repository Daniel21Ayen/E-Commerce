const { prisma } = require('../config/database');
const redis = require('../config/redis');
const { logger } = require('../middleware/logger');
const { Helpers } = require('../utils/helpers');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');
const cacheService = require('../services/cacheService');

class ProductController {
  /**
   * Get all products with pagination and filters
   */
  static async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        categoryId,
        minPrice,
        maxPrice,
        rating,
        inStock,
        search,
        brand,
        attributes
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build filter
      const where = {
        isActive: true,
        deletedAt: null
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      if (rating) {
        where.averageRating = { gte: parseFloat(rating) };
      }

      if (inStock === 'true') {
        where.stockQuantity = { gt: 0 };
      }

      if (brand) {
        where.brand = { contains: brand, mode: 'insensitive' };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Attribute filtering
      if (attributes) {
        const attrFilters = JSON.parse(attributes);
        for (const [key, value] of Object.entries(attrFilters)) {
          where.attributes = {
            some: {
              attributeName: key,
              attributeValue: { contains: value, mode: 'insensitive' }
            }
          };
        }
      }

      // Get products with cache
      const cacheKey = `products:list:${JSON.stringify(req.query)}`;
      const cached = await cacheService.getOrSet(cacheKey, async () => {
        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            include: {
              category: true,
              images: {
                orderBy: { sortOrder: 'asc' }
              },
              attributes: {
                where: { isFilterable: true }
              },
              variants: {
                where: { isActive: true }
              },
              _count: {
                select: {
                  reviews: {
                    where: { isApproved: true }
                  }
                }
              }
            },
            orderBy: {
              [sortBy]: sortOrder
            },
            skip,
            take
          }),
          prisma.product.count({ where })
        ]);

        return { products, total };
      }, 300); // 5 minutes cache

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: cached.products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: cached.total,
          pages: Math.ceil(cached.total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch products',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get single product by ID or slug
   */
  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Check cache
      const cacheKey = `product:${id}`;
      let product = await cacheService.getCachedProduct(id);

      if (!product) {
        // Fetch from database
        product = await prisma.product.findFirst({
          where: {
            OR: [
              { id: id },
              { slug: id }
            ],
            isActive: true,
            deletedAt: null
          },
          include: {
            category: true,
            images: {
              orderBy: { sortOrder: 'asc' }
            },
            attributes: true,
            variants: {
              where: { isActive: true }
            },
            reviews: {
              where: { isApproved: true },
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
                _count: {
                  select: {
                    likes: {
                      where: { isLike: true }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            _count: {
              select: {
                reviews: {
                  where: { isApproved: true }
                },
                wishlists: true
              }
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

        // Cache product
        await cacheService.cacheProduct(id, product);
      }

      // Track view if user is authenticated
      if (userId) {
        // Add to recently viewed
        await prisma.recentlyViewed.upsert({
          where: {
            userId_productId: {
              userId,
              productId: product.id
            }
          },
          update: {
            viewedAt: new Date()
          },
          create: {
            userId,
            productId: product.id
          }
        });

        // Increment view count
        await prisma.product.update({
          where: { id: product.id },
          data: {
            viewsCount: { increment: 1 }
          }
        });
      }

      // Check if product is in user's wishlist
      let isInWishlist = false;
      if (userId) {
        const wishlist = await prisma.wishlist.findUnique({
          where: {
            userId_productId_variantId: {
              userId,
              productId: product.id,
              variantId: null
            }
          }
        });
        isInWishlist = !!wishlist;
      }

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          ...product,
          isInWishlist
        }
      });
    } catch (error) {
      logger.error('Get product error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch product',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Create product (Admin only)
   */
  static async createProduct(req, res) {
    try {
      const {
        name,
        sku,
        price,
        description,
        shortDescription,
        categoryId,
        brand,
        stockQuantity,
        lowStockThreshold,
        isPhysical,
        isDigital,
        isFeatured,
        weight,
        dimensions,
        attributes,
        variants,
        images
      } = req.body;

      // Generate slug
      const slug = Helpers.slugify(name);

      // Check if SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku }
      });

      if (existingProduct) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          status: 'error',
          message: 'Product with this SKU already exists',
          code: RESPONSE_CODES.CONFLICT
        });
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          name,
          slug,
          sku,
          price: parseFloat(price),
          description,
          shortDescription,
          categoryId,
          brand,
          stockQuantity: parseInt(stockQuantity) || 0,
          lowStockThreshold: parseInt(lowStockThreshold) || 5,
          isPhysical: isPhysical !== false,
          isDigital: isDigital || false,
          isFeatured: isFeatured || false,
          weight: weight ? parseFloat(weight) : null,
          dimensions: dimensions || null,
          createdBy: req.user.id
        }
      });

      // Add attributes
      if (attributes && attributes.length > 0) {
        await prisma.productAttribute.createMany({
          data: attributes.map(attr => ({
            productId: product.id,
            attributeName: attr.name,
            attributeValue: attr.value,
            isFilterable: attr.isFilterable !== false
          }))
        });
      }

      // Add variants
      if (variants && variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map(variant => ({
            productId: product.id,
            sku: variant.sku || `${sku}-${Math.random().toString(36).substring(7)}`,
            attributes: variant.attributes,
            price: variant.price || product.price,
            stockQuantity: variant.stockQuantity || 0,
            imageUrl: variant.imageUrl || null
          }))
        });
      }

      // Add images
      if (images && images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img, index) => ({
            productId: product.id,
            imageUrl: img.url,
            altText: img.altText || name,
            isPrimary: index === 0,
            sortOrder: index
          }))
        });
      }

      // Clear cache
      await cacheService.clearProductCache(product.id);

      logger.info('Product created', {
        productId: product.id,
        name: product.name,
        createdBy: req.user.id
      });

      return res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      logger.error('Create product error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to create product',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update product (Admin only)
   */
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Product not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // If name changed, update slug
      if (updates.name && updates.name !== product.name) {
        updates.slug = Helpers.slugify(updates.name);
      }

      // If SKU changed, check uniqueness
      if (updates.sku && updates.sku !== product.sku) {
        const existingProduct = await prisma.product.findUnique({
          where: { sku: updates.sku }
        });
        if (existingProduct && existingProduct.id !== id) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            status: 'error',
            message: 'Product with this SKU already exists',
            code: RESPONSE_CODES.CONFLICT
          });
        }
      }

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updates,
        include: {
          images: true,
          attributes: true,
          variants: true
        }
      });

      // Clear cache
      await cacheService.clearProductCache(id);

      logger.info('Product updated', {
        productId: id,
        updatedBy: req.user.id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Product updated successfully',
        data: updatedProduct
      });
    } catch (error) {
      logger.error('Update product error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update product',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Delete product (Admin only)
   */
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Product not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Soft delete
      await prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      // Clear cache
      await cacheService.clearProductCache(id);

      logger.info('Product deleted', {
        productId: id,
        deletedBy: req.user.id
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Delete product error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to delete product',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get product reviews
   */
  static async getProductReviews(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, rating } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {
        productId: id,
        isApproved: true
      };

      if (rating) {
        where.rating = parseInt(rating);
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
      logger.error('Get product reviews error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch reviews',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get related products
   */
  static async getRelatedProducts(req, res) {
    try {
      const { id } = req.params;
      const { limit = 4 } = req.query;

      const product = await prisma.product.findUnique({
        where: { id },
        select: { categoryId: true }
      });

      if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Product not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      const relatedProducts = await prisma.product.findMany({
        where: {
          id: { not: id },
          categoryId: product.categoryId,
          isActive: true,
          deletedAt: null
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          },
          _count: {
            select: {
              reviews: {
                where: { isApproved: true }
              }
            }
          }
        },
        orderBy: [
          { salesCount: 'desc' },
          { averageRating: 'desc' }
        ],
        take: parseInt(limit)
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: relatedProducts
      });
    } catch (error) {
      logger.error('Get related products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch related products',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(req, res) {
    try {
      const { limit = 8 } = req.query;

      const products = await prisma.product.findMany({
        where: {
          isFeatured: true,
          isActive: true,
          deletedAt: null
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          },
          _count: {
            select: {
              reviews: {
                where: { isApproved: true }
              }
            }
          }
        },
        orderBy: { salesCount: 'desc' },
        take: parseInt(limit)
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: products
      });
    } catch (error) {
      logger.error('Get featured products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch featured products',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Search products with autocomplete
   */
  static async searchProducts(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'Search query must be at least 2 characters',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { shortDescription: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } }
          ],
          isActive: true,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { imageUrl: true }
          },
          averageRating: true,
          stockQuantity: true
        },
        take: parseInt(limit)
      });

      // Log search
      await prisma.searchLog.create({
        data: {
          userId: req.user?.id,
          searchQuery: q,
          resultsCount: products.length,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: products
      });
    } catch (error) {
      logger.error('Search products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Search failed',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get product categories
   */
  static async getCategories(req, res) {
    try {
      const categories = await prisma.category.findMany({
        where: {
          isActive: true,
          parentId: null
        },
        include: {
          children: {
            where: { isActive: true },
            include: {
              _count: {
                select: {
                  products: {
                    where: {
                      isActive: true,
                      deletedAt: null
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                  deletedAt: null
                }
              }
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: categories
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch categories',
        code: RESPONSE_CODES.ERROR
      });
    }
  }
}

module.exports = ProductController;