const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const Validators = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get(
  '/',
  protect,
  Validators.validate(Validators.pagination),
  OrderController.getOrders
);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *               notes:
 *                 type: string
 *               promoCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  protect,
  Validators.validate(Validators.order.create),
  OrderController.createOrder
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get single order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', protect, OrderController.getOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', protect, OrderController.cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/track:
 *   get:
 *     summary: Track order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking information retrieved
 *       404:
 *         description: No tracking information found
 */
router.get('/:id/track', protect, OrderController.trackOrder);

/**
 * @swagger
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: Download invoice PDF
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice PDF generated
 *       404:
 *         description: Order not found
 */
router.get('/:id/invoice', protect, OrderController.downloadInvoice);

module.exports = router;