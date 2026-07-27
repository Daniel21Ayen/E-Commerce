const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/', protect, WishlistController.getWishlist);

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to wishlist
 *       404:
 *         description: Product not found
 */
router.post('/', protect, WishlistController.addToWishlist);

/**
 * @swagger
 * /api/wishlist/{id}:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags: [Wishlist]
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
 *         description: Item removed from wishlist
 *       404:
 *         description: Item not found
 */
router.delete('/:id', protect, WishlistController.removeFromWishlist);

/**
 * @swagger
 * /api/wishlist/move-to-cart/{id}:
 *   post:
 *     summary: Move wishlist item to cart
 *     tags: [Wishlist]
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
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item moved to cart
 *       404:
 *         description: Item not found
 */
router.post('/move-to-cart/:id', protect, WishlistController.moveToCart);

module.exports = router;