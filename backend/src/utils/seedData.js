const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { logger } = require('../middleware/logger');
const constants = require('./constants');

const prisma = new PrismaClient();

class SeedData {
  constructor() {
    this.users = [];
    this.categories = [];
    this.products = [];
    this.promoCodes = [];
  }

  /**
   * Run seed
   */
  async run() {
    try {
      logger.info('🌱 Starting database seeding...');

      // Clear existing data (optional)
      await this.clearData();

      // Seed data
      await this.seedUsers();
      await this.seedCategories();
      await this.seedProducts();
      await this.seedPromoCodes();
      await this.seedReviews();
      await this.seedOrders();

      logger.info('✅ Database seeding completed successfully!');
    } catch (error) {
      logger.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Clear existing data
   */
  async clearData() {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('⚠️ Skipping clear data in production');
      return;
    }

    logger.info('🧹 Clearing existing data...');
    
    const modelNames = [
      'paymentTransaction', 'orderItem', 'order', 
      'review', 'reviewLike', 'wishlist', 'cartItem', 'cart',
      'productVariant', 'productAttribute', 'productImage', 'product',
      'category', 'promoCodeUsage', 'promoCode',
      'userProfile', 'user'
    ];

    for (const modelName of modelNames) {
      try {
        await prisma[modelName].deleteMany();
        logger.info(`Cleared ${modelName}`);
      } catch (error) {
        // Some models might not exist, skip
        logger.debug(`Skipped clearing ${modelName}`);
      }
    }

    logger.info('✅ Data cleared');
  }

  /**
   * Seed users
   */
  async seedUsers() {
    logger.info('👤 Seeding users...');

    const hashedPassword = await bcrypt.hash('Admin@2024', 10);
    const userPassword = await bcrypt.hash('User@2024', 10);

    this.users = await prisma.user.createMany({
      data: [
        {
          email: 'admin@ecommerce.com',
          passwordHash: hashedPassword,
          name: 'Admin User',
          role: 'admin',
          isEmailVerified: true,
          isActive: true,
          phone: '+1 234 567 8900',
          lastLogin: new Date()
        },
        {
          email: 'user@ecommerce.com',
          passwordHash: userPassword,
          name: 'John Doe',
          role: 'customer',
          isEmailVerified: true,
          isActive: true,
          phone: '+1 234 567 8901',
          lastLogin: new Date()
        },
        {
          email: 'jane@example.com',
          passwordHash: userPassword,
          name: 'Jane Smith',
          role: 'customer',
          isEmailVerified: true,
          isActive: true,
          phone: '+1 234 567 8902'
        },
        {
          email: 'bob@example.com',
          passwordHash: userPassword,
          name: 'Bob Johnson',
          role: 'customer',
          isEmailVerified: true,
          isActive: true,
          phone: '+1 234 567 8903'
        }
      ]
    });

    // Create user profiles
    const createdUsers = await prisma.user.findMany();
    
    await prisma.userProfile.createMany({
      data: createdUsers.map(user => ({
        userId: user.id,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        bio: `Hello, I'm ${user.name}. Welcome to E-Commerce!`,
        preferredLanguage: 'en'
      }))
    });

    logger.info(`✅ Created ${createdUsers.length} users`);
  }

  /**
   * Seed categories
   */
  async seedCategories() {
    logger.info('📂 Seeding categories...');

    const categories = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets',
        iconUrl: '📱',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        iconUrl: '👕',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Books',
        slug: 'books',
        description: 'Books and publications',
        iconUrl: '📚',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and gardening',
        iconUrl: '🏠',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Sports equipment and outdoor gear',
        iconUrl: '⚽',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Toys and games for all ages',
        iconUrl: '🧸',
        isActive: true,
        sortOrder: 6
      }
    ];

    const createdCategories = await prisma.category.createMany({
      data: categories
    });

    // Create subcategories
    const parentCategories = await prisma.category.findMany();
    const subcategories = [];

    for (const parent of parentCategories) {
      if (parent.slug === 'electronics') {
        subcategories.push(
          { name: 'Smartphones', slug: 'smartphones', parentId: parent.id, description: 'Mobile phones and accessories' },
          { name: 'Laptops', slug: 'laptops', parentId: parent.id, description: 'Portable computers' },
          { name: 'Tablets', slug: 'tablets', parentId: parent.id, description: 'Tablet computers' }
        );
      } else if (parent.slug === 'clothing') {
        subcategories.push(
          { name: 'Men\'s Clothing', slug: 'mens-clothing', parentId: parent.id, description: 'Clothing for men' },
          { name: 'Women\'s Clothing', slug: 'womens-clothing', parentId: parent.id, description: 'Clothing for women' },
          { name: 'Kids\' Clothing', slug: 'kids-clothing', parentId: parent.id, description: 'Clothing for kids' }
        );
      } else if (parent.slug === 'books') {
        subcategories.push(
          { name: 'Fiction', slug: 'fiction', parentId: parent.id, description: 'Fictional books' },
          { name: 'Non-Fiction', slug: 'non-fiction', parentId: parent.id, description: 'Non-fictional books' },
          { name: 'Academic', slug: 'academic', parentId: parent.id, description: 'Academic and educational books' }
        );
      }
    }

    await prisma.category.createMany({
      data: subcategories
    });

    logger.info(`✅ Created ${categories.length + subcategories.length} categories`);
  }

  /**
   * Seed products
   */
  async seedProducts() {
    logger.info('📦 Seeding products...');

    const categories = await prisma.category.findMany({
      where: { parentId: null }
    });

    const subcategories = await prisma.category.findMany({
      where: { parentId: { not: null } }
    });

    // Get users for product creation
    const users = await prisma.user.findMany();

    const productsData = [
      {
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        sku: 'IP15PM-001',
        description: 'The latest iPhone with advanced features, titanium design, and powerful A17 Pro chip.',
        shortDescription: 'Experience the future with iPhone 15 Pro Max',
        price: 1199.00,
        comparePrice: 1299.00,
        categoryId: subcategories.find(c => c.slug === 'smartphones')?.id,
        brand: 'Apple',
        stockQuantity: 50,
        lowStockThreshold: 10,
        isActive: true,
        isFeatured: true,
        weight: 0.5,
        dimensions: { length: 15, width: 7.5, height: 0.8 },
        averageRating: 4.8,
        totalReviews: 15,
        createdBy: users[0]?.id,
        viewsCount: 1500,
        salesCount: 150
      },
      {
        name: 'MacBook Pro 14"',
        slug: 'macbook-pro-14',
        sku: 'MBP14-001',
        description: 'Powerful laptop with M3 Pro chip, perfect for professionals and creatives.',
        shortDescription: 'Unleash your creativity with MacBook Pro',
        price: 1999.00,
        comparePrice: 2199.00,
        categoryId: subcategories.find(c => c.slug === 'laptops')?.id,
        brand: 'Apple',
        stockQuantity: 30,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        weight: 2.5,
        dimensions: { length: 31, width: 22, height: 1.5 },
        averageRating: 4.9,
        totalReviews: 20,
        createdBy: users[0]?.id,
        viewsCount: 1200,
        salesCount: 120
      },
      {
        name: 'Classic Leather Jacket',
        slug: 'classic-leather-jacket',
        sku: 'CLJ-001',
        description: 'High-quality genuine leather jacket, perfect for any occasion.',
        shortDescription: 'Timeless elegance in genuine leather',
        price: 299.00,
        comparePrice: 399.00,
        categoryId: subcategories.find(c => c.slug === 'mens-clothing')?.id,
        brand: 'Fashion Brand',
        stockQuantity: 25,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: false,
        weight: 1.8,
        dimensions: { length: 60, width: 40, height: 5 },
        averageRating: 4.7,
        totalReviews: 12,
        createdBy: users[0]?.id,
        viewsCount: 800,
        salesCount: 60
      },
      {
        name: 'Samsung QLED TV 65"',
        slug: 'samsung-qled-tv-65',
        sku: 'SQT65-001',
        description: 'Immerse yourself in stunning 4K QLED picture quality with Samsung\'s latest technology.',
        shortDescription: 'Experience cinema at home with QLED',
        price: 1499.00,
        comparePrice: 1699.00,
        categoryId: categories.find(c => c.slug === 'electronics')?.id,
        brand: 'Samsung',
        stockQuantity: 20,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        weight: 25.0,
        dimensions: { length: 145, width: 85, height: 10 },
        averageRating: 4.6,
        totalReviews: 18,
        createdBy: users[0]?.id,
        viewsCount: 1000,
        salesCount: 80
      },
      {
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270',
        sku: 'NAM270-001',
        description: 'Comfortable and stylish sneakers with Nike\'s signature Air cushioning.',
        shortDescription: 'Walk on air with Nike Air Max',
        price: 150.00,
        comparePrice: 180.00,
        categoryId: categories.find(c => c.slug === 'sports-outdoors')?.id,
        brand: 'Nike',
        stockQuantity: 40,
        lowStockThreshold: 10,
        isActive: true,
        isFeatured: false,
        weight: 0.8,
        dimensions: { length: 30, width: 20, height: 12 },
        averageRating: 4.5,
        totalReviews: 25,
        createdBy: users[0]?.id,
        viewsCount: 900,
        salesCount: 100
      },
      {
        name: 'Harry Potter Complete Set',
        slug: 'harry-potter-complete-set',
        sku: 'HPCS-001',
        description: 'Complete collection of all 7 Harry Potter books in a beautiful box set.',
        shortDescription: 'Magic awaits in every page',
        price: 120.00,
        comparePrice: 150.00,
        categoryId: subcategories.find(c => c.slug === 'fiction')?.id,
        brand: 'Bloomsbury',
        stockQuantity: 15,
        lowStockThreshold: 3,
        isActive: true,
        isFeatured: false,
        weight: 3.5,
        dimensions: { length: 25, width: 20, height: 15 },
        averageRating: 4.9,
        totalReviews: 30,
        createdBy: users[0]?.id,
        viewsCount: 700,
        salesCount: 45
      },
      {
        name: 'Garden Tool Set',
        slug: 'garden-tool-set',
        sku: 'GTS-001',
        description: 'Complete set of high-quality garden tools for all your gardening needs.',
        shortDescription: 'Everything you need for a beautiful garden',
        price: 89.99,
        comparePrice: 119.99,
        categoryId: categories.find(c => c.slug === 'home-garden')?.id,
        brand: 'GardenPro',
        stockQuantity: 35,
        lowStockThreshold: 8,
        isActive: true,
        isFeatured: false,
        weight: 5.0,
        dimensions: { length: 80, width: 30, height: 20 },
        averageRating: 4.3,
        totalReviews: 8,
        createdBy: users[0]?.id,
        viewsCount: 500,
        salesCount: 30
      },
      {
        name: 'LEGO Star Wars Millennium Falcon',
        slug: 'lego-star-wars-millennium-falcon',
        sku: 'LSWMF-001',
        description: 'Build the iconic Millennium Falcon with this detailed LEGO set.',
        shortDescription: 'Build the galaxy\'s most famous ship',
        price: 159.99,
        comparePrice: 199.99,
        categoryId: categories.find(c => c.slug === 'toys-games')?.id,
        brand: 'LEGO',
        stockQuantity: 10,
        lowStockThreshold: 2,
        isActive: true,
        isFeatured: true,
        weight: 6.0,
        dimensions: { length: 60, width: 40, height: 20 },
        averageRating: 4.8,
        totalReviews: 22,
        createdBy: users[0]?.id,
        viewsCount: 1100,
        salesCount: 90
      }
    ];

    // Create products
    for (const productData of productsData) {
      const product = await prisma.product.create({
        data: productData
      });

      // Create product images
      await prisma.productImage.createMany({
        data: [
          {
            productId: product.id,
            imageUrl: `https://picsum.photos/seed/${product.slug}/600/600`,
            altText: product.name,
            isPrimary: true,
            sortOrder: 0
          },
          {
            productId: product.id,
            imageUrl: `https://picsum.photos/seed/${product.slug}-2/600/600`,
            altText: `${product.name} - View 2`,
            isPrimary: false,
            sortOrder: 1
          },
          {
            productId: product.id,
            imageUrl: `https://picsum.photos/seed/${product.slug}-3/600/600`,
            altText: `${product.name} - View 3`,
            isPrimary: false,
            sortOrder: 2
          }
        ]
      });

      // Create product attributes
      await prisma.productAttribute.createMany({
        data: [
          { productId: product.id, attributeName: 'color', attributeValue: 'Black', isFilterable: true },
          { productId: product.id, attributeName: 'color', attributeValue: 'White', isFilterable: true },
          { productId: product.id, attributeName: 'color', attributeValue: 'Blue', isFilterable: true }
        ]
      });

      // Create product variants for some products
      if (product.sku.includes('CLJ') || product.sku.includes('NAM')) {
        const variants = [
          { sku: `${product.sku}-S`, attributes: { size: 'S' }, price: product.price * 0.9, stockQuantity: 5 },
          { sku: `${product.sku}-M`, attributes: { size: 'M' }, price: product.price, stockQuantity: 8 },
          { sku: `${product.sku}-L`, attributes: { size: 'L' }, price: product.price, stockQuantity: 7 },
          { sku: `${product.sku}-XL`, attributes: { size: 'XL' }, price: product.price * 1.1, stockQuantity: 3 }
        ];

        for (const variant of variants) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              ...variant
            }
          });
        }
      }
    }

    logger.info(`✅ Created ${productsData.length} products`);
  }

  /**
   * Seed promo codes
   */
  async seedPromoCodes() {
    logger.info('🏷️ Seeding promo codes...');

    const user = await prisma.user.findFirst();

    const promoCodes = [
      {
        code: 'WELCOME20',
        description: 'Welcome discount for new customers',
        discountType: 'percentage',
        discountValue: 20.00,
        minPurchase: 50.00,
        maxDiscount: 50.00,
        usageLimit: 100,
        perUserLimit: 1,
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31'),
        createdBy: user?.id
      },
      {
        code: 'SUMMER10',
        description: 'Summer sale discount',
        discountType: 'percentage',
        discountValue: 10.00,
        minPurchase: 0.00,
        maxDiscount: 30.00,
        usageLimit: 50,
        perUserLimit: 2,
        isActive: true,
        startsAt: new Date('2024-06-01'),
        expiresAt: new Date('2024-08-31'),
        createdBy: user?.id
      },
      {
        code: 'SAVE50',
        description: 'Save $50 on orders over $200',
        discountType: 'fixed',
        discountValue: 50.00,
        minPurchase: 200.00,
        maxDiscount: null,
        usageLimit: 20,
        perUserLimit: 1,
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31'),
        createdBy: user?.id
      },
      {
        code: 'FLASH25',
        description: 'Flash sale 25% off',
        discountType: 'percentage',
        discountValue: 25.00,
        minPurchase: 100.00,
        maxDiscount: 100.00,
        usageLimit: 10,
        perUserLimit: 1,
        isActive: true,
        startsAt: new Date('2024-07-15'),
        expiresAt: new Date('2024-07-20'),
        createdBy: user?.id
      },
      {
        code: 'FREESHIP',
        description: 'Free shipping on all orders',
        discountType: 'fixed',
        discountValue: 10.00,
        minPurchase: 0.00,
        maxDiscount: null,
        usageLimit: 200,
        perUserLimit: 3,
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31'),
        createdBy: user?.id
      }
    ];

    await prisma.promoCode.createMany({
      data: promoCodes
    });

    logger.info(`✅ Created ${promoCodes.length} promo codes`);
  }

  /**
   * Seed reviews
   */
  async seedReviews() {
    logger.info('⭐ Seeding reviews...');

    const users = await prisma.user.findMany({
      where: { role: 'customer' }
    });
    const products = await prisma.product.findMany();

    const reviews = [
      {
        productId: products[0]?.id,
        userId: users[0]?.id,
        rating: 5,
        title: 'Best phone ever!',
        description: 'The iPhone 15 Pro Max exceeded all my expectations. Battery life is amazing and the camera is incredible. The titanium build feels premium and the performance is lightning fast.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 12,
        notHelpfulCount: 1
      },
      {
        productId: products[1]?.id,
        userId: users[0]?.id,
        rating: 4,
        title: 'Great laptop for work',
        description: 'Perfect for my software development needs. Fast and reliable. The M3 Pro chip handles everything I throw at it. Battery life is excellent.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 5,
        notHelpfulCount: 0
      },
      {
        productId: products[2]?.id,
        userId: users[1]?.id,
        rating: 5,
        title: 'Excellent quality jacket',
        description: 'The leather is premium quality and fits perfectly. Highly recommend! It\'s comfortable and looks great for both casual and formal occasions.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 8,
        notHelpfulCount: 0
      },
      {
        productId: products[3]?.id,
        userId: users[2]?.id,
        rating: 5,
        title: 'Amazing TV!',
        description: 'The picture quality is stunning. Colors are vibrant and the HDR is impressive. Smart features are intuitive and responsive.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 10,
        notHelpfulCount: 1
      },
      {
        productId: products[4]?.id,
        userId: users[0]?.id,
        rating: 4,
        title: 'Very comfortable sneakers',
        description: 'Great fit and comfort. The Air Max cushioning is perfect for all-day wear. Stylish design too. Would buy again.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 6,
        notHelpfulCount: 0
      },
      {
        productId: products[5]?.id,
        userId: users[1]?.id,
        rating: 5,
        title: 'A must-have for HP fans',
        description: 'Beautiful box set that includes all 7 books. The quality of the books is excellent and they look great on a shelf.',
        isApproved: true,
        isVerifiedPurchase: false,
        helpfulCount: 15,
        notHelpfulCount: 2
      },
      {
        productId: products[6]?.id,
        userId: users[2]?.id,
        rating: 4,
        title: 'Good garden tools',
        description: 'Decent set of tools for the price. They feel durable and well-made. Great for beginners.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 3,
        notHelpfulCount: 0
      },
      {
        productId: products[7]?.id,
        userId: users[0]?.id,
        rating: 5,
        title: 'Incredible LEGO set',
        description: 'One of the best LEGO sets I\'ve built. The detail is amazing and it looks fantastic on display.',
        isApproved: true,
        isVerifiedPurchase: true,
        helpfulCount: 18,
        notHelpfulCount: 1
      }
    ];

    await prisma.review.createMany({
      data: reviews
    });

    logger.info(`✅ Created ${reviews.length} reviews`);
  }

  /**
   * Seed orders
   */
  async seedOrders() {
    logger.info('📋 Seeding orders...');

    const users = await prisma.user.findMany({
      where: { role: 'customer' }
    });
    const products = await prisma.product.findMany();

    const orders = [
      {
        userId: users[0]?.id,
        orderNumber: 'ORD202401001',
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        subtotal: 1199.00,
        discountAmount: 0,
        taxAmount: 95.92,
        shippingAmount: 0,
        totalAmount: 1294.92,
        currency: 'USD',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'credit_card',
        estimatedDeliveryDate: new Date('2024-01-10'),
        actualDeliveryDate: new Date('2024-01-08'),
        trackingNumber: 'TRK123456789',
        trackingCarrier: 'UPS',
        notes: 'Please handle with care',
        createdAt: new Date('2024-01-01')
      },
      {
        userId: users[1]?.id,
        orderNumber: 'ORD202402001',
        status: 'shipped',
        paymentStatus: 'paid',
        paymentMethod: 'paypal',
        subtotal: 299.00,
        discountAmount: 20.00,
        taxAmount: 23.92,
        shippingAmount: 5.99,
        totalAmount: 308.91,
        currency: 'USD',
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        billingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        paymentMethod: 'paypal',
        estimatedDeliveryDate: new Date('2024-02-15'),
        trackingNumber: 'TRK987654321',
        trackingCarrier: 'FedEx',
        notes: 'Leave at front door',
        createdAt: new Date('2024-02-01')
      },
      {
        userId: users[0]?.id,
        orderNumber: 'ORD202403001',
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        subtotal: 1499.00,
        discountAmount: 150.00,
        taxAmount: 119.92,
        shippingAmount: 0,
        totalAmount: 1468.92,
        currency: 'USD',
        shippingAddress: {
          street: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        billingAddress: {
          street: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        paymentMethod: 'credit_card',
        estimatedDeliveryDate: new Date('2024-03-20'),
        notes: 'Gift wrapping requested',
        createdAt: new Date('2024-03-01')
      }
    ];

    for (const orderData of orders) {
      const order = await prisma.order.create({
        data: orderData
      });

      // Create order items
      const items = [
        {
          orderId: order.id,
          productId: products[0]?.id,
          productName: products[0]?.name,
          productSku: products[0]?.sku,
          quantity: 1,
          price: products[0]?.price,
          totalPrice: products[0]?.price
        },
        {
          orderId: order.id,
          productId: products[2]?.id,
          productName: products[2]?.name,
          productSku: products[2]?.sku,
          quantity: 2,
          price: products[2]?.price,
          totalPrice: products[2]?.price * 2
        }
      ];

      await prisma.orderItem.createMany({
        data: items
      });
    }

    logger.info(`✅ Created ${orders.length} orders`);
  }
}

// Run seed
if (require.main === module) {
  const seed = new SeedData();
  seed.run()
    .catch(error => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

module.exports = SeedData;