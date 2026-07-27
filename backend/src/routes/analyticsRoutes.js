const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics endpoints
 */

// All analytics routes require authentication and admin role
router.use(protect, admin);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics dashboard data retrieved
 */
router.get('/dashboard', AnalyticsController.getDashboard);

/**
 * @swagger
 * /api/analytics/sales:
 *   get:
 *     summary: Get sales analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales analytics retrieved
 */
router.get('/sales', AnalyticsController.getSalesAnalytics);

/**
 * @swagger
 * /api/analytics/products:
 *   get:
 *     summary: Get product analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [sales, revenue, views, rating]
 *     responses:
 *       200:
 *         description: Product analytics retrieved
 */
router.get('/products', AnalyticsController.getProductAnalytics);

/**
 * @swagger
 * /api/analytics/customers:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Customer analytics retrieved
 */
router.get('/customers', AnalyticsController.getCustomerAnalytics);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved
 */
router.get('/revenue', AnalyticsController.getRevenueAnalytics);

/**
 * @swagger
 * /api/analytics/orders:
 *   get:
 *     summary: Get order analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Order analytics retrieved
 */
router.get('/orders', AnalyticsController.getOrderAnalytics);

/**
 * @swagger
 * /api/analytics/track:
 *   post:
 *     summary: Track user event
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *             properties:
 *               event:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Event tracked
 */
router.post('/track', AnalyticsController.trackEvent);

module.exports = router;