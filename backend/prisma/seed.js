const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.cartItem.deleteMany().catch(() => {});
    await prisma.cart.deleteMany().catch(() => {});
    await prisma.orderItem.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
    await prisma.review.deleteMany().catch(() => {});
    await prisma.wishlist.deleteMany().catch(() => {});
    await prisma.productImage.deleteMany().catch(() => {});
    await prisma.productVariant.deleteMany().catch(() => {});
    await prisma.productAttribute.deleteMany().catch(() => {});
    await prisma.product.deleteMany().catch(() => {});
    await prisma.category.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});

    console.log('✅ Cleared existing data');

    // Create Admin User
    const adminPassword = await bcrypt.hash('Admin@2024', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@ecommerce.com',
            passwordHash: adminPassword,
            name: 'Admin User',
            role: 'admin',
            isEmailVerified: true,
            isActive: true,
            profile: {
                create: {
                    preferredLanguage: 'en'
                }
            }
        }
    });
    console.log('✅ Admin user created');

    // Create Test User
    const userPassword = await bcrypt.hash('User@2024', 10);
    const user = await prisma.user.create({
        data: {
            email: 'user@ecommerce.com',
            passwordHash: userPassword,
            name: 'John Doe',
            role: 'customer',
            isEmailVerified: true,
            isActive: true,
            profile: {
                create: {
                    preferredLanguage: 'en'
                }
            }
        }
    });
    console.log('✅ Test user created');

    // Create Categories
    const categories = await prisma.category.createMany({
        data: [
            { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', iconUrl: '📱', isActive: true },
            { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', iconUrl: '👕', isActive: true },
            { name: 'Books', slug: 'books', description: 'Books and publications', iconUrl: '📚', isActive: true },
            { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and gardening', iconUrl: '🏠', isActive: true },
            { name: 'Sports', slug: 'sports', description: 'Sports equipment and outdoor gear', iconUrl: '⚽', isActive: true }
        ]
    });
    console.log('✅ Categories created');

    // Get category IDs
    const catList = await prisma.category.findMany();
    const catMap = {};
    catList.forEach(c => { catMap[c.slug] = c.id; });

    // Create Products with images using picsum.photos
    const products = [
        {
            name: 'iPhone 15 Pro Max',
            slug: 'iphone-15-pro-max',
            sku: 'IP15PM-001',
            description: 'The latest iPhone with advanced features, titanium design, and powerful A17 Pro chip. Experience the future of smartphone technology with this premium device.',
            shortDescription: 'Experience the future with iPhone 15 Pro Max',
            price: 1199.00,
            comparePrice: 1299.00,
            categoryId: catMap['electronics'],
            brand: 'Apple',
            stockQuantity: 50,
            lowStockThreshold: 10,
            isActive: true,
            isFeatured: true,
            averageRating: 4.8,
            totalReviews: 15,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/iphone15/400/400', alt: 'iPhone 15 Pro Max' },
                { url: 'https://picsum.photos/seed/iphone15-2/400/400', alt: 'iPhone 15 Pro Max - Back' }
            ]
        },
        {
            name: 'MacBook Pro 14"',
            slug: 'macbook-pro-14',
            sku: 'MBP14-001',
            description: 'Powerful laptop with M3 Pro chip, perfect for professionals and creatives. With up to 22 hours of battery life and stunning Liquid Retina XDR display.',
            shortDescription: 'Unleash your creativity with MacBook Pro',
            price: 1999.00,
            comparePrice: 2199.00,
            categoryId: catMap['electronics'],
            brand: 'Apple',
            stockQuantity: 30,
            lowStockThreshold: 5,
            isActive: true,
            isFeatured: true,
            averageRating: 4.9,
            totalReviews: 20,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/macbook/400/400', alt: 'MacBook Pro 14"' },
                { url: 'https://picsum.photos/seed/macbook-2/400/400', alt: 'MacBook Pro - Open' }
            ]
        },
        {
            name: 'Classic Leather Jacket',
            slug: 'classic-leather-jacket',
            sku: 'CLJ-001',
            description: 'High-quality genuine leather jacket, perfect for any occasion. Made from premium full-grain leather with a soft viscose lining for maximum comfort.',
            shortDescription: 'Timeless elegance in genuine leather',
            price: 299.00,
            comparePrice: 399.00,
            categoryId: catMap['clothing'],
            brand: 'Fashion Brand',
            stockQuantity: 25,
            lowStockThreshold: 5,
            isActive: true,
            isFeatured: false,
            averageRating: 4.7,
            totalReviews: 12,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/jacket/400/400', alt: 'Classic Leather Jacket' },
                { url: 'https://picsum.photos/seed/jacket-2/400/400', alt: 'Classic Leather Jacket - Detail' }
            ]
        },
        {
            name: 'Samsung QLED TV 65"',
            slug: 'samsung-qled-tv-65',
            sku: 'SQT65-001',
            description: 'Immerse yourself in stunning 4K QLED picture quality with Samsung\'s latest technology. Quantum Dot technology delivers 100% color volume for lifelike images.',
            shortDescription: 'Experience cinema at home with QLED',
            price: 1499.00,
            comparePrice: 1699.00,
            categoryId: catMap['electronics'],
            brand: 'Samsung',
            stockQuantity: 20,
            lowStockThreshold: 5,
            isActive: true,
            isFeatured: true,
            averageRating: 4.6,
            totalReviews: 18,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/tv/400/400', alt: 'Samsung QLED TV' },
                { url: 'https://picsum.photos/seed/tv-2/400/400', alt: 'Samsung QLED TV - Display' }
            ]
        },
        {
            name: 'Nike Air Max 270',
            slug: 'nike-air-max-270',
            sku: 'NAM270-001',
            description: 'Comfortable and stylish sneakers with Nike\'s signature Air cushioning. The visible Air unit provides responsive cushioning for all-day comfort.',
            shortDescription: 'Walk on air with Nike Air Max',
            price: 150.00,
            comparePrice: 180.00,
            categoryId: catMap['sports'],
            brand: 'Nike',
            stockQuantity: 40,
            lowStockThreshold: 10,
            isActive: true,
            isFeatured: false,
            averageRating: 4.5,
            totalReviews: 25,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/nike/400/400', alt: 'Nike Air Max 270' },
                { url: 'https://picsum.photos/seed/nike-2/400/400', alt: 'Nike Air Max 270 - Side' }
            ]
        },
        {
            name: 'Harry Potter Complete Set',
            slug: 'harry-potter-complete-set',
            sku: 'HPCS-001',
            description: 'Complete collection of all 7 Harry Potter books in a beautiful box set. Includes all original covers and illustrations.',
            shortDescription: 'Magic awaits in every page',
            price: 120.00,
            comparePrice: 150.00,
            categoryId: catMap['books'],
            brand: 'Bloomsbury',
            stockQuantity: 15,
            lowStockThreshold: 3,
            isActive: true,
            isFeatured: false,
            averageRating: 4.9,
            totalReviews: 30,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/harrypotter/400/400', alt: 'Harry Potter Complete Set' },
                { url: 'https://picsum.photos/seed/harrypotter-2/400/400', alt: 'Harry Potter Books' }
            ]
        },
        {
            name: 'Garden Tool Set',
            slug: 'garden-tool-set',
            sku: 'GTS-001',
            description: 'Complete set of high-quality garden tools for all your gardening needs. Includes trowel, pruner, weeder, and gloves.',
            shortDescription: 'Everything you need for a beautiful garden',
            price: 89.99,
            comparePrice: 119.99,
            categoryId: catMap['home-garden'],
            brand: 'GardenPro',
            stockQuantity: 35,
            lowStockThreshold: 8,
            isActive: true,
            isFeatured: false,
            averageRating: 4.3,
            totalReviews: 8,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/garden/400/400', alt: 'Garden Tool Set' },
                { url: 'https://picsum.photos/seed/garden-2/400/400', alt: 'Garden Tools' }
            ]
        },
        {
            name: 'Wireless Noise-Canceling Headphones',
            slug: 'wireless-headphones',
            sku: 'WNCH-001',
            description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life. Superior sound quality with adaptive noise cancellation.',
            shortDescription: 'Immerse yourself in crystal clear audio',
            price: 249.99,
            comparePrice: 299.99,
            categoryId: catMap['electronics'],
            brand: 'AudioTech',
            stockQuantity: 45,
            lowStockThreshold: 10,
            isActive: true,
            isFeatured: true,
            averageRating: 4.7,
            totalReviews: 22,
            createdBy: admin.id,
            images: [
                { url: 'https://picsum.photos/seed/headphones/400/400', alt: 'Wireless Headphones' },
                { url: 'https://picsum.photos/seed/headphones-2/400/400', alt: 'Wireless Headphones - Case' }
            ]
        }
    ];

    // Create products with images
    for (const productData of products) {
        const { images, ...productInfo } = productData;
        
        const product = await prisma.product.create({
            data: productInfo
        });

        // Add product images
        if (images && images.length > 0) {
            await prisma.productImage.createMany({
                data: images.map((img, index) => ({
                    productId: product.id,
                    imageUrl: img.url,
                    altText: img.alt || product.name,
                    isPrimary: index === 0,
                    sortOrder: index
                }))
            });
        }

        // Add product attributes
        await prisma.productAttribute.createMany({
            data: [
                { productId: product.id, attributeName: 'Color', attributeValue: 'Black', isFilterable: true },
                { productId: product.id, attributeName: 'Color', attributeValue: 'White', isFilterable: true },
                { productId: product.id, attributeName: 'Color', attributeValue: 'Silver', isFilterable: true }
            ]
        });

        console.log(`✅ Product created: ${product.name}`);
    }

    console.log('✅ Database seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@ecommerce.com / Admin@2024');
    console.log('User: user@ecommerce.com / User@2024');
}

main()
    .catch(e => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
