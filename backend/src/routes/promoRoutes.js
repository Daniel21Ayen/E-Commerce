const express = require('express');
const router = express.Router();
const PromoController = require('../controllers/promoController');
const { protect, admin } = require('../middleware/auth');
const Validators = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: PromoCodes
 *   description: Promo code management
 */

/**
 * @swagger
 * /api/promos/validate:
 *   post:
 *     summary: Validate promo code
 *     tags: [PromoCodes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *               subtotal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Promo code validated
 */
router.post('/validate', PromoController.validatePromoCode);

/**
 * @swagger
 * /api/promos:
 *   get:
 *     summary: Get all promo codes (admin)
 *     tags: [PromoCodes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Promo codes retrieved
 */
router.get('/', protect, admin, PromoController.getAllPromoCodes);

/**
 * @swagger
 * /api/promos:
 *   post:
 *     summary: Create promo code (admin)
 *     tags: [PromoCodes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               minPurchase:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               usageLimit:
 *                 type: integer
 *               perUserLimit:
 *                 type: integer
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Promo code created
 */
router.post(
  '/',
  protect,
  admin,
  Validators.validate(Validators.promoCode.create),
  PromoController.createPromoCode
);

/**
 * @swagger
 * /api/promos/{id}:
 *   put:
 *     summary: Update promo code (admin)
 *     tags: [PromoCodes]
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
 *     responses:
 *       200:
 *         description: Promo code updated
 */
router.put(
  '/:id',
  protect,
  admin,
  Validators.validate(Validators.promoCode.create),
  PromoController.updatePromoCode
);

/**
 * @swagger
 * /api/promos/{id}:
 *   delete:
 *     summary: Delete promo code (admin)
 *     tags: [PromoCodes]
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
 *         description: Promo code deleted
 */
router.delete('/:id', protect, admin, PromoController.deletePromoCode);

/**
 * @swagger
 * /api/promos/{id}/toggle:
 *   patch:
 *     summary: Toggle promo code status (admin)
 *     tags: [PromoCodes]
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
 *         description: Promo code toggled
 */
router.patch('/:id/toggle', protect, admin, PromoController.togglePromoCode);

module.exports = router;