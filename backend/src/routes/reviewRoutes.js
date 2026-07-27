const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const Validators = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews management
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create product review
 *     tags: [Reviews]
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
 *               - rating
 *               - title
 *               - description
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  protect,
  Validators.validate(Validators.review.create),
  ReviewController.createReview
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
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
 *               rating:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 */
router.put(
  '/:id',
  protect,
  Validators.validate(Validators.review.create),
  ReviewController.updateReview
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete('/:id', protect, ReviewController.deleteReview);

/**
 * @swagger
 * /api/reviews/{id}/like:
 *   post:
 *     summary: Like/Unlike review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
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
 *               - isLike
 *             properties:
 *               isLike:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review liked/unliked
 *       404:
 *         description: Review not found
 */
router.post(
  '/:id/like',
  protect,
  ReviewController.toggleLike
);

module.exports = router;