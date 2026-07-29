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

module.exports = router;
