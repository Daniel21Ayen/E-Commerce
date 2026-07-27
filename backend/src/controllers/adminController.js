/**
 * Admin Controller
 * Handles admin dashboard, inventory, analytics, import/export
 */

const { prisma } = require('../config/database');
const { logger } = require('../middleware/logger');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');
const { Helpers } = require('../utils/helpers');
const cacheService = require('../services/cacheService');
const emailService = require('../services/emailService');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req, res) {
    try {
      const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
        prisma.user.count({
          where: { role: 'customer' }
        }),
        prisma.product.count({
          where: { isActive: true, deletedAt: null }
        }),
        prisma.order.count(),
        prisma.order.aggregate({
          where: {
            status: { in: ['processing', 'shipped', 'delivered'] }
          },
          _sum: {
            totalAmount: true
          }
        })
      ]);

      // Get recent orders
      const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          items: {
            take: 1
          }
        }
      });

      // Get low stock products
      const lowStockProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          stockQuantity: {
            lte: prisma.product.fields.lowStockThreshold
          }
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true
        },
        take: 10,
        orderBy: { stockQuantity: 'asc' }
      });

      // Get daily sales for chart
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailySales = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['processing', 'shipped', 'delivered'] }
        },
        _sum: {
          totalAmount: true
        },
        _count: true
      });

      // Format chart data
      const chartData = dailySales.map(day => ({
        date: day.createdAt.toISOString().split('T')[0],
        revenue: day._sum.totalAmount || 0,
        orders: day._count
      }));

      // Get product categories for pie chart
      const categoryDistribution = await prisma.product.groupBy({
        by: ['categoryId'],
        where: {
          isActive: true,
          deletedAt: null
        },
        _count: true
      });

      const categoryNames = await prisma.category.findMany({
        where: {
          id: {
            in: categoryDistribution.map(c => c.categoryId).filter(Boolean)
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      const categoryData = categoryDistribution.map(cat => ({
        category: categoryNames.find(c => c.id === cat.categoryId)?.name || 'Uncategorized',
        count: cat._count
      }));

      // Get order status distribution
      const statusDistribution = await prisma.order.groupBy({
        by: ['status'],
        _count: true
      });

      const orderStatusData = statusDistribution.map(status => ({
        status: status.status,
        count: status._count
      }));

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          stats: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            pendingOrders: statusDistribution.find(s => s.status === 'pending')?._count || 0,
            processingOrders: statusDistribution.find(s => s.status === 'processing')?._count || 0,
            shippedOrders: statusDistribution.find(s => s.status === 'shipped')?._count || 0,
            deliveredOrders: statusDistribution.find(s => s.status === 'delivered')?._count || 0
          },
          recentOrders,
          lowStockProducts: {
            count: lowStockProducts.length,
            items: lowStockProducts
          },
          charts: {
            dailySales: chartData,
            categoryDistribution: categoryData,
            orderStatus: orderStatusData
          }
        }
      });
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get dashboard stats',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get all products (admin)
   */
  static async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        categoryId,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (status === 'active') {
        where.isActive = true;
        where.deletedAt = null;
      } else if (status === 'inactive') {
        where.isActive = false;
      } else if (status === 'deleted') {
        where.deletedAt = { not: null };
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            images: {
              where: { isPrimary: true },
              take: 1
            },
            _count: {
              select: {
                reviews: {
                  where: { isApproved: true }
                },
                orderItems: true
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

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get all products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get products',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Import products from CSV
   */
  static async importProducts(req, res) {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: 'error',
          message: 'No file uploaded',
          code: RESPONSE_CODES.VALIDATION_ERROR
        });
      }

      const results = [];
      let imported = 0;
      let failed = 0;
      const errors = [];

      // Parse CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv.parse({ headers: true }))
          .on('error', reject)
          .on('data', (row) => results.push(row))
          .on('end', resolve);
      });

      // Process each row
      for (const row of results) {
        try {
          // Validate required fields
          if (!row.name || !row.sku || !row.price) {
            failed++;
            errors.push(`Missing required fields for row: ${JSON.stringify(row)}`);
            continue;
          }

          // Check if SKU exists
          const existing = await prisma.product.findUnique({
            where: { sku: row.sku }
          });

          if (existing) {
            failed++;
            errors.push(`SKU ${row.sku} already exists`);
            continue;
          }

          // Get category
          let categoryId = null;
          if (row.category) {
            const category = await prisma.category.findFirst({
              where: {
                OR: [
                  { name: { equals: row.category, mode: 'insensitive' } },
                  { slug: { equals: row.category.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } }
                ]
              }
            });
            if (category) {
              categoryId = category.id;
            }
          }

          // Create product
          await prisma.product.create({
            data: {
              name: row.name,
              slug: Helpers.slugify(row.name),
              sku: row.sku,
              description: row.description || null,
              shortDescription: row.shortDescription || null,
              price: parseFloat(row.price),
              comparePrice: row.comparePrice ? parseFloat(row.comparePrice) : null,
              costPrice: row.costPrice ? parseFloat(row.costPrice) : null,
              categoryId,
              brand: row.brand || null,
              stockQuantity: parseInt(row.stockQuantity) || 0,
              lowStockThreshold: parseInt(row.lowStockThreshold) || 5,
              isActive: row.isActive !== 'false',
              isFeatured: row.isFeatured === 'true',
              createdBy: req.user.id
            }
          });

          imported++;
        } catch (error) {
          failed++;
          errors.push(`Error processing row: ${error.message}`);
        }
      }

      // Clean up file
      fs.unlinkSync(req.file.path);

      // Send low stock alert if needed
      if (imported > 0) {
        const lowStockItems = await prisma.product.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            stockQuantity: {
              lte: prisma.product.fields.lowStockThreshold
            }
          },
          take: 20
        });

        if (lowStockItems.length > 0) {
          await emailService.sendLowStockAlert(lowStockItems);
        }
      }

      logger.info('Products imported', {
        adminId: req.user.id,
        imported,
        failed
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: `Products imported: ${imported} successful, ${failed} failed`,
        data: {
          imported,
          failed,
          errors: errors.slice(0, 100) // Limit errors
        }
      });
    } catch (error) {
      logger.error('Import products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to import products',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Export products to CSV
   */
  static async exportProducts(req, res) {
    try {
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null
        },
        include: {
          category: true
        }
      });

      // Format for CSV
      const data = products.map(p => ({
        name: p.name,
        sku: p.sku,
        price: p.price,
        comparePrice: p.comparePrice,
        description: p.description,
        shortDescription: p.shortDescription,
        category: p.category?.name || '',
        brand: p.brand || '',
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews
      }));

      const fields = [
        'name', 'sku', 'price', 'comparePrice', 'description',
        'shortDescription', 'category', 'brand', 'stockQuantity',
        'lowStockThreshold', 'isActive', 'isFeatured',
        'averageRating', 'totalReviews'
      ];

      const parser = new Parser({ fields });
      const csvData = parser.parse(data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=products_${Date.now()}.csv`);

      return res.status(HTTP_STATUS.OK).send(csvData);
    } catch (error) {
      logger.error('Export products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to export products',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get all orders (admin)
   */
  static async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        search,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true
                  }
                }
              }
            },
            promoCode: true,
            payments: true,
            tracking: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
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
      logger.error('Get all orders error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get orders',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, trackingNumber, trackingCarrier, notes } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: true,
          items: true
        }
      });

      if (!order) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: 'error',
          message: 'Order not found',
          code: RESPONSE_CODES.NOT_FOUND
        });
      }

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status,
          trackingNumber: trackingNumber || order.trackingNumber,
          trackingCarrier: trackingCarrier || order.trackingCarrier,
          notes: notes || order.notes,
          updatedAt: new Date(),
          ...(status === 'delivered' && { actualDeliveryDate: new Date() })
        }
      });

      // Add tracking entry
      await prisma.orderTracking.create({
        data: {
          orderId: id,
          status,
          description: `Order status updated to ${status}`,
          isCurrent: true,
          timestamp: new Date()
        }
      });

      // Send email notification
      await emailService.sendOrderStatusUpdate(updatedOrder, order.user, status, order.status);

      logger.info('Order status updated', {
        adminId: req.user.id,
        orderId: id,
        oldStatus: order.status,
        newStatus: status
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Order status updated',
        data: updatedOrder
      });
    } catch (error) {
      logger.error('Update order status error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to update order status',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get inventory status
   */
  static async getInventoryStatus(req, res) {
    try {
      const { page = 1, limit = 50, search, stockStatus } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {
        isActive: true,
        deletedAt: null
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (stockStatus === 'low') {
        where.stockQuantity = { lte: prisma.product.fields.lowStockThreshold };
      } else if (stockStatus === 'out') {
        where.stockQuantity = 0;
      } else if (stockStatus === 'in') {
        where.stockQuantity = { gt: 0 };
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            variants: {
              where: { isActive: true },
              select: {
                id: true,
                sku: true,
                stockQuantity: true,
                attributes: true
              }
            }
          },
          orderBy: { stockQuantity: 'asc' },
          skip,
          take
        }),
        prisma.product.count({ where })
      ]);

      // Calculate summary stats
      const totalProducts = await prisma.product.count({
        where: { isActive: true, deletedAt: null }
      });

      const lowStockCount = await prisma.product.count({
        where: {
          isActive: true,
          deletedAt: null,
          stockQuantity: {
            lte: prisma.product.fields.lowStockThreshold
          }
        }
      });

      const outOfStockCount = await prisma.product.count({
        where: {
          isActive: true,
          deletedAt: null,
          stockQuantity: 0
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          summary: {
            totalProducts,
            lowStock: lowStockCount,
            outOfStock: outOfStockCount,
            inStock: totalProducts - lowStockCount
          },
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get inventory status error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get inventory status',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(req, res) {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          stockQuantity: {
            lte: prisma.product.fields.lowStockThreshold
          }
        },
        include: {
          category: {
            select: {
              name: true
            }
          }
        },
        orderBy: { stockQuantity: 'asc' },
        take: 50
      });

      // Send alert if there are low stock items
      if (products.length > 0) {
        // Check last alert time (cache)
        const lastAlertKey = 'low_stock_alert_last_sent';
        const lastAlert = await cacheService.get(lastAlertKey);
        const now = Date.now();

        if (!lastAlert || (now - parseInt(lastAlert)) > 3600000) { // 1 hour
          await emailService.sendLowStockAlert(products);
          await cacheService.set(lastAlertKey, now.toString(), 3600);
        }
      }

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          count: products.length,
          products
        }
      });
    } catch (error) {
      logger.error('Get low stock products error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get low stock products',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(req, res) {
    try {
      const { period = 'monthly', dateFrom, dateTo } = req.query;

      let startDate, endDate;
      if (dateFrom && dateTo) {
        startDate = new Date(dateFrom);
        endDate = new Date(dateTo);
      } else {
        const now = new Date();
        if (period === 'daily') {
          startDate = new Date(now.setDate(now.getDate() - 30));
        } else if (period === 'weekly') {
          startDate = new Date(now.setDate(now.getDate() - 90));
        } else if (period === 'monthly') {
          startDate = new Date(now.setMonth(now.getMonth() - 12));
        } else {
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        }
        endDate = new Date();
      }

      const sales = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: { in: ['processing', 'shipped', 'delivered'] }
        },
        _sum: {
          totalAmount: true
        },
        _count: true
      });

      // Format data for chart
      const chartData = sales.map(s => ({
        date: s.createdAt.toISOString().split('T')[0],
        revenue: s._sum.totalAmount || 0,
        orders: s._count
      }));

      // Calculate totals
      const totalRevenue = sales.reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0);
      const totalOrders = sales.reduce((sum, s) => sum + s._count, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get top products
      const topProducts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.total_price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('processing', 'shipped', 'delivered')
          AND o.created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10
      `;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          summary: {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            period
          },
          chartData,
          topProducts
        }
      });
    } catch (error) {
      logger.error('Get sales analytics error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get sales analytics',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics(req, res) {
    try {
      const { limit = 10 } = req.query;

      // Top selling products
      const topSelling = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.price,
          SUM(oi.quantity) as total_sold,
          SUM(oi.total_price) as revenue,
          COUNT(DISTINCT oi.order_id) as order_count,
          p.stock_quantity
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('processing', 'shipped', 'delivered')
        GROUP BY p.id, p.name, p.sku, p.price, p.stock_quantity
        ORDER BY revenue DESC
        LIMIT ${parseInt(limit)}
      `;

      // Products with most views
      const mostViewed = await prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          sku: true,
          viewsCount: true,
          averageRating: true,
          stockQuantity: true
        },
        orderBy: { viewsCount: 'desc' },
        take: parseInt(limit)
      });

      // Categories with most sales
      const categorySales = await prisma.$queryRaw`
        SELECT 
          c.id,
          c.name,
          COUNT(oi.id) as items_sold,
          SUM(oi.total_price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('processing', 'shipped', 'delivered')
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          topSelling,
          mostViewed,
          categorySales
        }
      });
    } catch (error) {
      logger.error('Get product analytics error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get product analytics',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get customer analytics
   */
  static async getCustomerAnalytics(req, res) {
    try {
      const { period = 'monthly' } = req.query;

      // Total customers
      const totalCustomers = await prisma.user.count({
        where: { role: 'customer' }
      });

      // New customers by period
      let startDate;
      const now = new Date();
      if (period === 'daily') {
        startDate = new Date(now.setDate(now.getDate() - 30));
      } else if (period === 'weekly') {
        startDate = new Date(now.setDate(now.getDate() - 90));
      } else {
        startDate = new Date(now.setMonth(now.getMonth() - 12));
      }

      const newCustomers = await prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          role: 'customer',
          createdAt: { gte: startDate }
        },
        _count: true
      });

      // Customer retention (repeat customers)
      const repeatCustomers = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(o.id) as order_count,
          SUM(o.total_amount) as total_spent,
          MAX(o.created_at) as last_order
        FROM users u
        JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'customer'
          AND o.status IN ('processing', 'shipped', 'delivered')
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(o.id) > 1
        ORDER BY total_spent DESC
        LIMIT 20
      `;

      // Average order value by customer
      const avgOrderValue = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          COUNT(o.id) as order_count,
          AVG(o.total_amount) as avg_order_value,
          SUM(o.total_amount) as total_spent
        FROM users u
        JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'customer'
          AND o.status IN ('processing', 'shipped', 'delivered')
        GROUP BY u.id, u.name
        ORDER BY total_spent DESC
        LIMIT 20
      `;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          summary: {
            totalCustomers,
            newCustomers: newCustomers.length,
            repeatCustomers: repeatCustomers.length
          },
          newCustomersData: newCustomers.map(c => ({
            date: c.createdAt.toISOString().split('T')[0],
            count: c._count
          })),
          repeatCustomers,
          avgOrderValue
        }
      });
    } catch (error) {
      logger.error('Get customer analytics error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get customer analytics',
        code: RESPONSE_CODES.ERROR
      });
    }
  }
}

module.exports = AdminController;