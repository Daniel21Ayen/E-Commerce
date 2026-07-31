require('dotenv').config();
const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');
const redis = require('./src/config/redis');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
// backend/server.js - Add at the top after dotenv.config()
require('dotenv').config();

// Debug: Check if JWT_SECRET is loaded
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Not loaded');
console.log('📧 SMTP_USER:', process.env.SMTP_USER || '❌ Not set');

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack Trace:', err.stack);
  
  // Close database connections
  await prisma.$disconnect();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack Trace:', err.stack);
  
  // Close database connections
  await prisma.$disconnect();
  process.exit(1);
});

// Connect to PostgreSQL
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully');
    
    // Test the connection
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log(`📅 Database time: ${result[0].current_time}`);
    
    // Get database version
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log(`🐘 PostgreSQL version: ${version[0].version}`);
    
    return prisma;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('Error Details:', error);
    process.exit(1);
  }
};

// Connect to Redis
const connectRedis = async () => {
  try {
    await redis.connect();
    console.log('✅ Redis connected successfully');
    
    // Test Redis connection
    await redis.set('test_connection', 'ok', 10);
    const testResult = await redis.get('test_connection');
    if (testResult === 'ok') {
      console.log('✅ Redis test successful');
    }
    await redis.del('test_connection');
     
    return redis;
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    console.warn('⚠️  Redis is not available, continuing without caching...');
    return null;
  }
};

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close HTTP server
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Disconnect from Redis
    if (redis && redis.isConnected) {
      try {
        await redis.client.quit();
        console.log('Redis disconnected');
      } catch (error) {
        console.error('Error disconnecting Redis:', error);
      }
    }
    
    // Disconnect from PostgreSQL
    try {
      await prisma.$disconnect();
      console.log('PostgreSQL disconnected');
    } catch (error) {
      console.error('Error disconnecting PostgreSQL:', error);
    }
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Initialize server
const startServer = async () => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('\n=================================');
      console.log('🚀 E-Commerce Server Started');
      console.log('=================================');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      console.log('=================================\n');
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
let server;
startServer().then((s) => {
  server = s;
}).catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export for testing
module.exports = { app, prisma, redis };