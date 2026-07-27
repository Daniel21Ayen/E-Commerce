const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

// All admin routes require authentication and admin role
router.use(protect, admin);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
router.get('/dashboard', AdminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products (admin)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved
 */
router.get('/products', AdminController.getAllProducts);

/**
 * @swagger
 * /api/admin/products/import:
 *   post:
 *     summary: Import products from CSV
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Products imported successfully
 */
router.post('/products/import', AdminController.importProducts);

/**
 * @swagger
 * /api/admin/products/export:
 *   get:
 *     summary: Export products to CSV
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: CSV file generated
 */
router.get('/products/export', AdminController.exportProducts);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (admin)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         description: Orders retrieved
 */
router.get('/orders', AdminController.getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *               trackingCarrier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/orders/:id/status', AdminController.updateOrderStatus);

/**
 * @swagger
 * /api/admin/inventory:
 *   get:
 *     summary: Get inventory status
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Inventory status retrieved
 */
router.get('/inventory', AdminController.getInventoryStatus);

/**
 * @swagger
 * /api/admin/inventory/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Low stock products retrieved
 */
router.get('/inventory/low-stock', AdminController.getLowStockProducts);

/**
 * @swagger
 * /api/admin/analytics/sales:
 *   get:
 *     summary: Get sales analytics
 *     tags: [Admin]
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
router.get('/analytics/sales', AdminController.getSalesAnalytics);

/**
 * @swagger
 * /api/admin/analytics/products:
 *   get:
 *     summary: Get product analytics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Product analytics retrieved
 */
router.get('/analytics/products', AdminController.getProductAnalytics);

/**
 * @swagger
 * /api/admin/analytics/customers:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Customer analytics retrieved
 */
router.get('/analytics/customers', AdminController.getCustomerAnalytics);

module.exports = router;