/**
 * Analytics Controller
 * Handles sales, product, customer, and revenue analytics
 */

const { prisma } = require('../config/database');
const { logger } = require('../middleware/logger');
const { HTTP_STATUS, RESPONSE_CODES } = require('../utils/constants');
const cacheService = require('../services/cacheService');

class AnalyticsController {
  /**
   * Get analytics dashboard
   */
  static async getDashboard(req, res) {
    try {
      const cacheKey = 'analytics:dashboard';
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return res.status(HTTP_STATUS.OK).json({
          status: 'success',
          data: cached,
          cached: true
        });
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Get current month stats
      const [currentMonthStats, currentYearStats, lifetimeStats] = await Promise.all([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startOfMonth },
            status: { in: ['processing', 'shipped', 'delivered'] }
          },
          _count: true,
          _sum: {
            totalAmount: true
          }
        }),
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startOfYear },
            status: { in: ['processing', 'shipped', 'delivered'] }
          },
          _count: true,
          _sum: {
            totalAmount: true
          }
        }),
        prisma.order.aggregate({
          where: {
            status: { in: ['processing', 'shipped', 'delivered'] }
          },
          _count: true,
          _sum: {
            totalAmount: true
          }
        })
      ]);

      // Get customer stats
      const [totalCustomers, newCustomersThisMonth, activeCustomers] = await Promise.all([
        prisma.user.count({
          where: { role: 'customer' }
        }),
        prisma.user.count({
          where: {
            role: 'customer',
            createdAt: { gte: startOfMonth }
          }
        }),
        prisma.user.count({
          where: {
            role: 'customer',
            lastLogin: { gte: startOfMonth }
          }
        })
      ]);

      // Get product stats
      const [totalProducts, outOfStockProducts] = await Promise.all([
        prisma.product.count({
          where: { isActive: true, deletedAt: null }
        }),
        prisma.product.count({
          where: {
            isActive: true,
            deletedAt: null,
            stockQuantity: 0
          }
        })
      ]);

      // Get conversion rate
      const conversionRate = totalCustomers > 0
        ? (lifetimeStats._count / totalCustomers) * 100
        : 0;

      const data = {
        summary: {
          revenue: {
            monthly: currentMonthStats._sum.totalAmount || 0,
            yearly: currentYearStats._sum.totalAmount || 0,
            lifetime: lifetimeStats._sum.totalAmount || 0
          },
          orders: {
            monthly: currentMonthStats._count || 0,
            yearly: currentYearStats._count || 0,
            lifetime: lifetimeStats._count || 0
          },
          customers: {
            total: totalCustomers,
            newThisMonth: newCustomersThisMonth,
            active: activeCustomers
          },
          products: {
            total: totalProducts,
            outOfStock: outOfStockProducts
          },
          conversionRate: parseFloat(conversionRate.toFixed(2))
        }
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, data, 300);

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data
      });
    } catch (error) {
      logger.error('Get analytics dashboard error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get analytics dashboard',
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

      // Get sales data
      const salesData = await prisma.order.groupBy({
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

      // Format chart data
      const chartData = salesData.map(s => ({
        date: s.createdAt.toISOString().split('T')[0],
        revenue: s._sum.totalAmount || 0,
        orders: s._count
      }));

      // Calculate metrics
      const totalRevenue = salesData.reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0);
      const totalOrders = salesData.reduce((sum, s) => sum + s._count, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get top products
      const topProducts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          SUM(oi.quantity) as quantity_sold,
          SUM(oi.total_price) as revenue,
          COUNT(DISTINCT oi.order_id) as order_count
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('processing', 'shipped', 'delivered')
          AND o.created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY p.id, p.name, p.sku
        ORDER BY revenue DESC
        LIMIT 10
      `;

      // Get payment method breakdown
      const paymentMethods = await prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: { in: ['processing', 'shipped', 'delivered'] }
        },
        _count: true,
        _sum: {
          totalAmount: true
        }
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          summary: {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          chartData,
          topProducts,
          paymentMethods: paymentMethods.map(p => ({
            method: p.paymentMethod,
            count: p._count,
            total: p._sum.totalAmount || 0
          }))
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
      const { limit = 10, sortBy = 'revenue' } = req.query;

      // Top selling products
      const topSelling = await prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.price,
          p.stock_quantity,
          p.average_rating,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COALESCE(SUM(oi.total_price), 0) as revenue,
          COUNT(DISTINCT oi.order_id) as order_count,
          COALESCE(r.review_count, 0) as review_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('processing', 'shipped', 'delivered')
        LEFT JOIN (
          SELECT product_id, COUNT(*) as review_count 
          FROM reviews 
          WHERE is_approved = true 
          GROUP BY product_id
        ) r ON p.id = r.product_id
        WHERE p.is_active = true AND p.deleted_at IS NULL
        GROUP BY p.id, p.name, p.sku, p.price, p.stock_quantity, p.average_rating, r.review_count
        ORDER BY revenue DESC
        LIMIT ${parseInt(limit)}
      `;

      // Products with most views
      const mostViewed = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          sku: true,
          viewsCount: true,
          averageRating: true,
          stockQuantity: true,
          salesCount: true
        },
        orderBy: { viewsCount: 'desc' },
        take: parseInt(limit)
      });

      // Products with best rating
      const topRated = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          totalReviews: { gt: 0 }
        },
        select: {
          id: true,
          name: true,
          sku: true,
          averageRating: true,
          totalReviews: true,
          price: true,
          salesCount: true
        },
        orderBy: [
          { averageRating: 'desc' },
          { totalReviews: 'desc' }
        ],
        take: parseInt(limit)
      });

      // Category performance
      const categoryPerformance = await prisma.$queryRaw`
        SELECT 
          c.id,
          c.name,
          COUNT(DISTINCT p.id) as product_count,
          COALESCE(SUM(oi.quantity), 0) as items_sold,
          COALESCE(SUM(oi.total_price), 0) as revenue
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true AND p.deleted_at IS NULL
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('processing', 'shipped', 'delivered')
        WHERE c.is_active = true
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          topSelling,
          mostViewed,
          topRated,
          categoryPerformance
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

      // Customer lifecycle
      const customerLifecycle = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_customers,
          COUNT(DISTINCT u.id) as total_customers
        FROM users u
        WHERE u.role = 'customer'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12
      `;

      // Customer segments
      const customerSegments = await prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN COUNT(o.id) = 0 THEN 'new'
            WHEN COUNT(o.id) = 1 THEN 'one_time'
            WHEN COUNT(o.id) BETWEEN 2 AND 5 THEN 'regular'
            ELSE 'loyal'
          END as segment,
          COUNT(DISTINCT u.id) as customer_count,
          AVG(o.total_amount) as avg_order_value,
          SUM(o.total_amount) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id AND o.status IN ('processing', 'shipped', 'delivered')
        WHERE u.role = 'customer'
        GROUP BY segment
      `;

      // Geographic distribution
      const geoDistribution = await prisma.$queryRaw`
        SELECT 
          COALESCE(NULLIF(address->>'country', ''), 'Unknown') as country,
          COUNT(*) as customer_count,
          COUNT(o.id) as order_count,
          SUM(o.total_amount) as total_spent
        FROM users u
        LEFT JOIN (
          SELECT * FROM orders WHERE status IN ('processing', 'shipped', 'delivered')
        ) o ON u.id = o.user_id
        LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
        CROSS JOIN LATERAL jsonb_build_object(
          'country', a.country
        ) as address
        WHERE u.role = 'customer'
        GROUP BY country
        ORDER BY customer_count DESC
        LIMIT 10
      `;

      // Customer loyalty
      const loyaltyMetrics = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(o.id) as order_count,
          SUM(o.total_amount) as total_spent,
          MAX(o.created_at) as last_order,
          MIN(o.created_at) as first_order
        FROM users u
        JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'customer'
          AND o.status IN ('processing', 'shipped', 'delivered')
        GROUP BY u.id, u.name, u.email
        ORDER BY total_spent DESC
        LIMIT 20
      `;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          customerLifecycle: customerLifecycle.reverse(),
          customerSegments,
          geoDistribution,
          loyaltyMetrics
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

  /**
   * Get revenue analytics
   */
  static async getRevenueAnalytics(req, res) {
    try {
      const { period = 'monthly' } = req.query;

      // Revenue by period
      const revenueByPeriod = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as period,
          COUNT(*) as order_count,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_order_value
        FROM orders
        WHERE status IN ('processing', 'shipped', 'delivered')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY period DESC
        LIMIT 12
      `;

      // Revenue by product category
      const revenueByCategory = await prisma.$queryRaw`
        SELECT 
          c.name as category,
          SUM(oi.total_price) as revenue,
          COUNT(oi.id) as items_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('processing', 'shipped', 'delivered')
        GROUP BY c.name
        ORDER BY revenue DESC
      `;

      // Revenue trends
      const revenueTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          SUM(total_amount) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE status IN ('processing', 'shipped', 'delivered')
          AND created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week ASC
      `;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          revenueByPeriod: revenueByPeriod.reverse(),
          revenueByCategory,
          revenueTrends: revenueTrends.map(r => ({
            week: r.week.toISOString().split('T')[0],
            revenue: r.revenue || 0,
            orders: parseInt(r.orders) || 0
          }))
        }
      });
    } catch (error) {
      logger.error('Get revenue analytics error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get revenue analytics',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Get order analytics
   */
  static async getOrderAnalytics(req, res) {
    try {
      const { period = 'monthly' } = req.query;

      // Order status distribution
      const statusDistribution = await prisma.order.groupBy({
        by: ['status'],
        _count: true
      });

      // Order timeline
      const orderTimeline = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as orders,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_value
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
      `;

      // Fulfillment metrics
      const fulfillmentMetrics = await prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (actual_delivery_date - created_at))/86400) as avg_delivery_days,
          COUNT(CASE WHEN actual_delivery_date IS NOT NULL THEN 1 END) as delivered,
          COUNT(CASE WHEN actual_delivery_date IS NULL AND status != 'cancelled' THEN 1 END) as pending_delivery,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(*) as total
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        data: {
          statusDistribution: statusDistribution.map(s => ({
            status: s.status,
            count: s._count
          })),
          orderTimeline: orderTimeline.map(o => ({
            date: o.date.toISOString().split('T')[0],
            orders: parseInt(o.orders) || 0,
            revenue: o.revenue || 0,
            avgValue: o.avg_value || 0
          })),
          fulfillmentMetrics: {
            avgDeliveryDays: parseFloat(fulfillmentMetrics[0]?.avg_delivery_days?.toFixed(2) || 0),
            delivered: parseInt(fulfillmentMetrics[0]?.delivered || 0),
            pendingDelivery: parseInt(fulfillmentMetrics[0]?.pending_delivery || 0),
            cancelled: parseInt(fulfillmentMetrics[0]?.cancelled || 0),
            total: parseInt(fulfillmentMetrics[0]?.total || 0),
            deliveryRate: fulfillmentMetrics[0]?.total > 0 
              ? ((fulfillmentMetrics[0]?.delivered / fulfillmentMetrics[0]?.total) * 100).toFixed(2)
              : 0
          }
        }
      });
    } catch (error) {
      logger.error('Get order analytics error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get order analytics',
        code: RESPONSE_CODES.ERROR
      });
    }
  }

  /**
   * Track user event
   */
  static async trackEvent(req, res) {
    try {
      const { event, data } = req.body;
      const userId = req.user?.id || null;

      await prisma.userActivityLog.create({
        data: {
          userId,
          action: event,
          details: data || {},
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      logger.debug('Event tracked', {
        userId,
        event,
        data
      });

      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Event tracked'
      });
    } catch (error) {
      logger.error('Track event error:', error);
      // Don't fail on tracking errors
      return res.status(HTTP_STATUS.OK).json({
        status: 'success',
        message: 'Event tracked'
      });
    }
  }
}

module.exports = AnalyticsController;