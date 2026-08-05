const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AuthController = require('../controllers/authController');
const Validators = require('../utils/validators');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', protect, AuthController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/profile',
  protect,
  Validators.validate(Validators.user.updateProfile),
  AuthController.updateProfile
);

/**
 * @swagger
 * /api/users/addresses:
 *   get:
 *     summary: Get all user addresses
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved
 */
router.get('/addresses', protect, AuthController.getAddresses);

/**
 * @swagger
 * /api/users/addresses:
 *   post:
 *     summary: Add a new address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Address added
 */
router.post(
  '/addresses',
  protect,
  Validators.validate(Validators.user.address.create),
  AuthController.addAddress
);

/**
 * @swagger
 * /api/users/addresses/{addressId}:
 *   put:
 *     summary: Update an address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address updated
 */
router.put(
  '/addresses/:addressId',
  protect,
  Validators.validate(Validators.user.address.update),
  AuthController.updateAddress
);

/**
 * @swagger
 * /api/users/addresses/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address deleted
 */
router.delete('/addresses/:addressId', protect, AuthController.deleteAddress);

/**
 * @swagger
 * /api/users/addresses/{addressId}/default:
 *   put:
 *     summary: Set default address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default address set
 */
router.put(
  '/addresses/:addressId/default',
  protect,
  AuthController.setDefaultAddress
);

module.exports = router;
