const express = require('express');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const { logger } = require('../middleware/logger');

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File upload endpoints
 */

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload a single file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
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
 *         description: File uploaded successfully
 *       400:
 *         description: Upload error
 */
router.post(
  '/',
  protect,
  uploadMiddleware.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file provided'
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Process image if it's an image
      let processedPath = req.file.path;
      if (req.file.mimetype.startsWith('image/')) {
        try {
          processedPath = await uploadMiddleware.processImage(req.file.path, {
            width: 1200,
            quality: 80,
            format: 'webp'
          });
        } catch (processError) {
          logger.warn('Image processing failed, using original:', processError.message);
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          path: processedPath
        }
      });
    } catch (error) {
      logger.error('Upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'File upload failed'
      });
    }
  }
);

/**
 * @swagger
 * /api/uploads/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post(
  '/multiple',
  protect,
  uploadMiddleware.multiple('files', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No files provided'
        });
      }

      const uploadedFiles = await Promise.all(req.files.map(async (file) => {
        let processedPath = file.path;
        if (file.mimetype.startsWith('image/')) {
          try {
            processedPath = await uploadMiddleware.processImage(file.path, {
              width: 1200,
              quality: 80,
              format: 'webp'
            });
          } catch (processError) {
            logger.warn('Image processing failed, using original:', processError.message);
          }
        }

        return {
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          path: processedPath
        };
      }));

      res.status(200).json({
        status: 'success',
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: uploadedFiles
      });
    } catch (error) {
      logger.error('Multiple upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'File upload failed'
      });
    }
  }
);

/**
 * @swagger
 * /api/uploads/product-image:
 *   post:
 *     summary: Upload product image
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product image uploaded
 */
router.post(
  '/product-image',
  protect,
  uploadMiddleware.single('productImage'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image provided'
        });
      }

      // Generate multiple sizes for product image
      const sizes = await uploadMiddleware.generateImageSizes(req.file.path);

      res.status(200).json({
        status: 'success',
        message: 'Product image uploaded successfully',
        data: {
          original: {
            filename: req.file.filename,
            url: `/uploads/products/${req.file.filename}`
          },
          sizes
        }
      });
    } catch (error) {
      logger.error('Product image upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Product image upload failed'
      });
    }
  }
);

/**
 * @swagger
 * /api/uploads/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post(
  '/avatar',
  protect,
  uploadMiddleware.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image provided'
        });
      }

      // Process avatar to standard size
      const processedPath = await uploadMiddleware.processImage(req.file.path, {
        width: 200,
        height: 200,
        quality: 90,
        format: 'webp',
        fit: 'cover'
      });

      res.status(200).json({
        status: 'success',
        message: 'Avatar uploaded successfully',
        data: {
          filename: req.file.filename,
          url: `/uploads/profiles/${path.basename(processedPath)}`
        }
      });
    } catch (error) {
      logger.error('Avatar upload error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Avatar upload failed'
      });
    }
  }
);

/**
 * Delete uploaded file
 */
router.delete('/:filename', protect, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { filename } = req.params;

    // Search for file in upload directories
    const dirs = ['uploads', 'uploads/products', 'uploads/profiles', 'uploads/reviews'];
    let deleted = false;

    for (const dir of dirs) {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }
  } catch (error) {
    logger.error('File deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'File deletion failed'
    });
  }
});

module.exports = router;

