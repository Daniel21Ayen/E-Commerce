const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const { logger } = require('./logger');

/**
 * File Upload Middleware
 * Comprehensive file upload handling with image optimization
 */
class UploadMiddleware {
  constructor() {
    this.storage = null;
    this.upload = null;
    this.setupStorage();
    this.setupUpload();
  }

  /**
   * Setup storage configuration
   */
  setupStorage() {
    // Create upload directories
    const uploadDirs = [
      'uploads',
      'uploads/products',
      'uploads/profiles',
      'uploads/reviews',
      'uploads/temp'
    ];

    uploadDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Configure storage
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        let dest = 'uploads';
        
        if (file.fieldname === 'productImage' || file.fieldname === 'productImages') {
          dest = 'uploads/products';
        } else if (file.fieldname === 'profileImage' || file.fieldname === 'avatar') {
          dest = 'uploads/profiles';
        } else if (file.fieldname === 'reviewImage' || file.fieldname === 'reviewImages') {
          dest = 'uploads/reviews';
        } else if (file.fieldname === 'tempFile') {
          dest = 'uploads/temp';
        }

        cb(null, dest);
      },
      
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-');
        
        const filename = `${baseName}-${uniqueSuffix}${ext}`;
        cb(null, filename);
      }
    });
  }

  /**
   * Setup multer upload with file filter
   */
  setupUpload() {
    const fileFilter = (req, file, cb) => {
      // Allowed MIME types
      const allowedTypes = {
        'image/jpeg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true,
        'image/svg+xml': true,
        'image/bmp': true,
        'image/tiff': true,
        'application/pdf': true,
        'application/msword': true,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
        'application/vnd.ms-excel': true,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
        'application/zip': true,
        'application/x-rar-compressed': true
      };

      // Check MIME type
      if (allowedTypes[file.mimetype]) {
        // Additional validation for images
        if (file.mimetype.startsWith('image/')) {
          // Check file size in callback
          cb(null, true);
        } else {
          cb(null, true);
        }
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
      }
    };

    this.upload = multer({
      storage: this.storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10,
        fieldSize: 10 * 1024 * 1024,
        parts: 100,
        headerPairs: 2000
      }
    });
  }

  /**
   * Middleware for single file upload
   */
  single(fieldName) {
    return (req, res, next) => {
      this.upload.single(fieldName)(req, res, (err) => {
        if (err) {
          return this.handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  }

  /**
   * Middleware for multiple file upload
   */
  multiple(fieldName, maxCount = 5) {
    return (req, res, next) => {
      this.upload.array(fieldName, maxCount)(req, res, (err) => {
        if (err) {
          return this.handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  }

  /**
   * Middleware for multiple fields
   */
  fields(fields) {
    return (req, res, next) => {
      this.upload.fields(fields)(req, res, (err) => {
        if (err) {
          return this.handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  }

  /**
   * Handle multer errors
   */
  handleMulterError(err, req, res, next) {
    logger.error('Multer error:', err);

    if (err instanceof multer.MulterError) {
      let message = 'File upload failed';
      let code = 'UPLOAD_ERROR';

      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File is too large. Maximum size is 10MB.';
          code = 'UPLOAD_FILE_TOO_LARGE';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files uploaded.';
          code = 'UPLOAD_TOO_MANY_FILES';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected file field.';
          code = 'UPLOAD_UNEXPECTED_FIELD';
          break;
        case 'LIMIT_PART_COUNT':
          message = 'Too many parts in the request.';
          code = 'UPLOAD_TOO_MANY_PARTS';
          break;
        default:
          message = err.message;
          code = 'UPLOAD_ERROR';
      }

      return res.status(400).json({
        status: 'error',
        message,
        code
      });
    }

    // Handle file type errors
    if (err.message && err.message.includes('File type')) {
      return res.status(400).json({
        status: 'error',
        message: err.message,
        code: 'UPLOAD_INVALID_FILE_TYPE'
      });
    }

    // Pass other errors to global error handler
    next(err);
  }

  /**
   * Process and optimize images after upload
   */
  static async processImage(filePath, options = {}) {
    try {
      const {
        width = 800,
        height = 800,
        quality = 80,
        format = 'webp',
        fit = 'cover',
        position = 'center'
      } = options;

      const outputPath = filePath.replace(/\.\w+$/, `.${format}`);
      
      let pipeline = sharp(filePath);

      // Resize if dimensions provided
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit: fit,
          position: position,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        });
      }

      // Convert format
      if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      } else if (format === 'jpeg' || format === 'jpg') {
        pipeline = pipeline.jpeg({ quality, progressive: true });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
      } else if (format === 'avif') {
        pipeline = pipeline.avif({ quality });
      }

      // Save processed image
      await pipeline.toFile(outputPath);

      // Remove original file if different format
      if (outputPath !== filePath) {
        fs.unlinkSync(filePath);
      }

      return outputPath;
    } catch (error) {
      logger.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Generate multiple image sizes
   */
  static async generateImageSizes(filePath, options = {}) {
    try {
      const sizes = options.sizes || [
        { width: 50, height: 50, suffix: 'thumb' },
        { width: 150, height: 150, suffix: 'small' },
        { width: 300, height: 300, suffix: 'medium' },
        { width: 600, height: 600, suffix: 'large' },
        { width: 1200, height: 1200, suffix: 'xlarge' }
      ];

      const results = [];
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      const dir = path.dirname(filePath);

      for (const size of sizes) {
        const outputPath = path.join(dir, `${baseName}-${size.suffix}${ext}`);
        
        await sharp(filePath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toFile(outputPath);

        results.push({
          size: size.suffix,
          width: size.width,
          height: size.height,
          path: outputPath,
          url: `/uploads/${path.relative('uploads', outputPath)}`
        });
      }

      return results;
    } catch (error) {
      logger.error('Image resize error:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      errors.push('File size must be less than 10MB');
    }

    // Check file type for images
    if (file.mimetype.startsWith('image/')) {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedImageTypes.includes(file.mimetype)) {
        errors.push('Image must be JPEG, PNG, WebP, or GIF');
      }
    }

    // Check file name
    const filename = file.originalname;
    if (!filename || filename.length > 255) {
      errors.push('Filename must not exceed 255 characters');
    }

    // Check for dangerous extensions
    const dangerousExt = ['.php', '.exe', '.sh', '.bat', '.cmd', '.js', '.html', '.htm'];
    const ext = path.extname(filename).toLowerCase();
    if (dangerousExt.includes(ext)) {
      errors.push('File type not allowed for security reasons');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Upload file to cloud storage (placeholder for future integration)
   */
  static async uploadToCloud(localPath, options = {}) {
    try {
      // This is a placeholder for cloud storage integration
      // Implement with your preferred cloud provider (AWS S3, Cloudinary, etc.)
      logger.info('Cloud upload placeholder', { localPath, options });
      return {
        url: localPath.replace('uploads/', '/uploads/'),
        path: localPath
      };
    } catch (error) {
      logger.error('Cloud upload error:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  static async cleanupTempFiles(ageInHours = 24) {
    try {
      const tempDir = 'uploads/temp';
      if (!fs.existsSync(tempDir)) return;

      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      let deleted = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60); // hours

        if (fileAge > ageInHours) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      }

      logger.info(`Cleaned up ${deleted} temporary files`);
      return deleted;
    } catch (error) {
      logger.error('Cleanup temp files error:', error);
      return 0;
    }
  }
}

// Create singleton instance
const uploadMiddleware = new UploadMiddleware();

// Add static methods to the instance
uploadMiddleware.processImage = UploadMiddleware.processImage;
uploadMiddleware.generateImageSizes = UploadMiddleware.generateImageSizes;
uploadMiddleware.validateFile = UploadMiddleware.validateFile;
uploadMiddleware.uploadToCloud = UploadMiddleware.uploadToCloud;
uploadMiddleware.cleanupTempFiles = UploadMiddleware.cleanupTempFiles;

module.exports = uploadMiddleware;