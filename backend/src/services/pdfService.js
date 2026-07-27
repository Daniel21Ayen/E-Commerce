const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/logger');
const redis = require('../config/redis');

class PDFService {
  constructor() {
    this.templates = {};
    this.fonts = {};
    this.loadFonts();
    this.ensureDirectory();
  }

  /**
   * Ensure PDF directory exists
   */
  ensureDirectory() {
    const pdfDir = path.join(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    this.pdfDir = pdfDir;
  }

  /**
   * Load fonts
   */
  loadFonts() {
    try {
      // Register fonts (using built-in PDFKit fonts as fallback)
      this.fonts = {
        regular: 'Helvetica',
        bold: 'Helvetica-Bold',
        italic: 'Helvetica-Oblique',
        boldItalic: 'Helvetica-BoldOblique'
      };
    } catch (error) {
      logger.error('Error loading PDF fonts:', error);
    }
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoice(order, user, options = {}) {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice #${order.orderNumber}`,
          Author: process.env.STORE_NAME || 'E-Commerce',
          Subject: 'Order Invoice',
          Keywords: 'invoice, ecommerce, order'
        }
      });

      // Create filename
      const filename = `invoice-${order.orderNumber}-${Date.now()}.pdf`;
      const filepath = path.join(this.pdfDir, filename);

      // Pipe to file
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // Generate content
      await this.generateInvoiceContent(doc, order, user, options);

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Store in cache
      await redis.set(`pdf:${order.id}`, {
        filename,
        filepath,
        orderId: order.id,
        generatedAt: new Date().toISOString()
      }, 60 * 60 * 24 * 30); // 30 days

      logger.info(`Invoice PDF generated: ${filename}`);

      return {
        success: true,
        filename,
        filepath,
        url: `/uploads/pdfs/${filename}`
      };
    } catch (error) {
      logger.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  /**
   * Generate invoice content
   */
  async generateInvoiceContent(doc, order, user, options) {
    const { 
      primaryColor = '#667eea',
      secondaryColor = '#764ba2',
      storeName = process.env.STORE_NAME || 'E-Commerce',
      storeAddress = process.env.STORE_ADDRESS || '123 Main St, City, Country',
      storePhone = process.env.STORE_PHONE || '+1 234 567 890'
    } = options;

    // Header
    doc
      .fontSize(24)
      .font(this.fonts.bold)
      .fillColor(primaryColor)
      .text(storeName, 50, 45)
      .fontSize(10)
      .fillColor('#666')
      .text(`Address: ${storeAddress}`, 50, 75)
      .text(`Phone: ${storePhone}`, 50, 90)
      .moveDown();

    // Invoice Title
    doc
      .fontSize(18)
      .font(this.fonts.bold)
      .fillColor(primaryColor)
      .text('INVOICE', { align: 'center' })
      .moveDown();

    // Invoice Details
    const invoiceY = doc.y;
    doc
      .fontSize(10)
      .font(this.fonts.regular)
      .fillColor('#333');

    // Left column
    doc
      .text(`Invoice #: ${order.orderNumber}`, 50, invoiceY)
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, invoiceY + 15)
      .text(`Payment Method: ${order.paymentMethod}`, 50, invoiceY + 30);

    // Right column
    doc
      .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 350, invoiceY)
      .text(`Status: ${order.status.toUpperCase()}`, 350, invoiceY + 15)
      .text(`Transaction ID: ${order.paymentTransactionId || 'N/A'}`, 350, invoiceY + 30);

    doc.moveDown(2);

    // Bill To
    doc
      .fontSize(12)
      .font(this.fonts.bold)
      .fillColor('#333')
      .text('BILL TO:')
      .fontSize(10)
      .font(this.fonts.regular)
      .fillColor('#666')
      .text(user.name)
      .text(user.email);

    if (order.shippingAddress) {
      doc
        .text(order.shippingAddress.street)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`)
        .text(order.shippingAddress.country);
    }

    doc.moveDown();

    // Order Items Table
    const tableTop = doc.y;
    const tableHeight = 20;
    const itemHeight = 25;

    // Table Headers
    doc
      .fontSize(10)
      .font(this.fonts.bold)
      .fillColor('white')
      .rect(50, tableTop, 500, tableHeight)
      .fill(primaryColor)
      .fillColor('white')
      .text('Product', 60, tableTop + 5)
      .text('Qty', 330, tableTop + 5, { width: 50, align: 'center' })
      .text('Price', 390, tableTop + 5, { width: 70, align: 'right' })
      .text('Total', 470, tableTop + 5, { width: 70, align: 'right' })
      .fillColor('#333');

    // Table Body
    let currentY = tableTop + tableHeight;
    let total = 0;

    for (const item of order.items) {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      // Alternate row colors
      if (currentY % 50 === 0) {
        doc.rect(50, currentY, 500, itemHeight).fill('#f9f9f9');
      }

      doc
        .fontSize(10)
        .font(this.fonts.regular)
        .fillColor('#333')
        .text(item.productName, 60, currentY + 5, { width: 270 })
        .text(item.quantity.toString(), 330, currentY + 5, { width: 50, align: 'center' })
        .text(`$${item.price.toFixed(2)}`, 390, currentY + 5, { width: 70, align: 'right' })
        .text(`$${itemTotal.toFixed(2)}`, 470, currentY + 5, { width: 70, align: 'right' });

      currentY += itemHeight;
    }

    // Total Section
    const totalY = currentY + 20;
    const discountTotal = order.discountAmount || 0;
    const subtotal = order.subtotal;
    const shipping = order.shippingAmount || 0;
    const tax = order.taxAmount || 0;
    const grandTotal = order.totalAmount;

    doc
      .fontSize(10)
      .font(this.fonts.regular)
      .fillColor('#333');

    // Lines
    doc.moveTo(350, totalY).lineTo(550, totalY).stroke();
    doc.moveTo(350, totalY + 25).lineTo(550, totalY + 25).stroke();

    // Totals
    doc
      .font(this.fonts.bold)
      .text('Subtotal:', 350, totalY + 5)
      .text(`$${subtotal.toFixed(2)}`, 470, totalY + 5, { align: 'right' });

    if (discountTotal > 0) {
      doc
        .fillColor('#dc3545')
        .text('Discount:', 350, totalY + 20)
        .text(`-$${discountTotal.toFixed(2)}`, 470, totalY + 20, { align: 'right' })
        .fillColor('#333');
    }

    if (shipping > 0) {
      doc
        .text('Shipping:', 350, totalY + 35)
        .text(`$${shipping.toFixed(2)}`, 470, totalY + 35, { align: 'right' });
    }

    if (tax > 0) {
      doc
        .text('Tax:', 350, totalY + 50)
        .text(`$${tax.toFixed(2)}`, 470, totalY + 50, { align: 'right' });
    }

    // Grand Total
    doc
      .fontSize(14)
      .font(this.fonts.bold)
      .fillColor(primaryColor)
      .text('Total:', 350, totalY + 70)
      .text(`$${grandTotal.toFixed(2)}`, 470, totalY + 70, { align: 'right' });

    // Footer
    const footerY = doc.page.height - 50;
    doc
      .fontSize(8)
      .font(this.fonts.regular)
      .fillColor('#999')
      .text('Thank you for your business!', 50, footerY, { align: 'center' })
      .text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 15, { align: 'center' })
      .text(storeName, 50, footerY + 30, { align: 'center' });
  }

  /**
   * Generate packing slip PDF
   */
  async generatePackingSlip(order, user, options = {}) {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const filename = `packing-slip-${order.orderNumber}-${Date.now()}.pdf`;
      const filepath = path.join(this.pdfDir, filename);

      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // Generate content
      await this.generatePackingSlipContent(doc, order, user, options);

      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      return {
        success: true,
        filename,
        filepath,
        url: `/uploads/pdfs/${filename}`
      };
    } catch (error) {
      logger.error('Error generating packing slip:', error);
      throw error;
    }
  }

  /**
   * Generate packing slip content
   */
  async generatePackingSlipContent(doc, order, user, options) {
    const storeName = process.env.STORE_NAME || 'E-Commerce';
    const storeAddress = process.env.STORE_ADDRESS || '123 Main St, City, Country';

    // Header
    doc
      .fontSize(20)
      .font(this.fonts.bold)
      .fillColor('#333')
      .text('PACKING SLIP', { align: 'center' })
      .moveDown();

    // Order Info
    doc
      .fontSize(10)
      .font(this.fonts.regular)
      .fillColor('#666')
      .text(`Order #: ${order.orderNumber}`)
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Status: ${order.status.toUpperCase()}`)
      .moveDown();

    // Shipping Address
    doc
      .fontSize(12)
      .font(this.fonts.bold)
      .fillColor('#333')
      .text('SHIP TO:')
      .fontSize(10)
      .font(this.fonts.regular)
      .fillColor('#666');

    if (order.shippingAddress) {
      doc
        .text(order.shippingAddress.street)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`)
        .text(order.shippingAddress.country);
    }

    doc.moveDown();

    // Items Table
    const tableTop = doc.y;
    const tableHeight = 20;
    const itemHeight = 25;

    // Table Headers
    doc
      .fontSize(10)
      .font(this.fonts.bold)
      .fillColor('white')
      .rect(50, tableTop, 500, tableHeight)
      .fill('#333')
      .fillColor('white')
      .text('SKU', 60, tableTop + 5)
      .text('Product', 150, tableTop + 5)
      .text('Qty', 400, tableTop + 5, { width: 50, align: 'center' })
      .fillColor('#333');

    // Table Body
    let currentY = tableTop + tableHeight;

    for (const item of order.items) {
      doc
        .fontSize(10)
        .font(this.fonts.regular)
        .fillColor('#333')
        .text(item.productSku, 60, currentY + 5, { width: 80 })
        .text(item.productName, 150, currentY + 5, { width: 240 })
        .text(item.quantity.toString(), 400, currentY + 5, { width: 50, align: 'center' });

      currentY += itemHeight;
    }

    // Footer
    doc
      .fontSize(8)
      .font(this.fonts.regular)
      .fillColor('#999')
      .text('Thank you for your order!', 50, doc.page.height - 50, { align: 'center' })
      .text(storeName, 50, doc.page.height - 35, { align: 'center' })
      .text(storeAddress, 50, doc.page.height - 20, { align: 'center' });
  }

  /**
   * Get generated PDF
   */
  async getPDF(orderId) {
    try {
      const cached = await redis.get(`pdf:${orderId}`);
      if (cached) {
        return cached;
      }
      return null;
    } catch (error) {
      logger.error('Error getting PDF from cache:', error);
      return null;
    }
  }

  /**
   * Delete PDF
   */
  async deletePDF(orderId) {
    try {
      const pdfInfo = await redis.get(`pdf:${orderId}`);
      if (pdfInfo && fs.existsSync(pdfInfo.filepath)) {
        fs.unlinkSync(pdfInfo.filepath);
        await redis.del(`pdf:${orderId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting PDF:', error);
      return false;
    }
  }

  /**
   * Clean old PDFs
   */
  async cleanOldPDFs(daysOld = 30) {
    try {
      const files = fs.readdirSync(this.pdfDir);
      const now = Date.now();
      let deleted = 0;

      for (const file of files) {
        const filepath = path.join(this.pdfDir, file);
        const stats = fs.statSync(filepath);
        const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

        if (fileAge > daysOld) {
          fs.unlinkSync(filepath);
          deleted++;
        }
      }

      logger.info(`Cleaned up ${deleted} old PDF files`);
      return deleted;
    } catch (error) {
      logger.error('Error cleaning old PDFs:', error);
      return 0;
    }
  }
}

// Create singleton instance
const pdfService = new PDFService();

// Clean old PDFs daily
setInterval(() => {
  pdfService.cleanOldPDFs(30).catch(err => {
    logger.error('Error cleaning old PDFs:', err);
  });
}, 24 * 60 * 60 * 1000); // Daily

module.exports = pdfService;