const { PrismaClient } = require('@prisma/client');
const { logger } = require('../middleware/logger');

class Database {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  // Initialize Prisma Client with connection pooling
  getPrisma() {
    if (!this.prisma) {
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
        errorFormat: 'pretty',
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      // Add middleware for soft delete
      this.prisma.$use(async (params, next) => {
        // Handle soft delete for models with deletedAt field
        if (params.model && params.model !== 'User' && params.model !== 'AuditLog') {
          const modelsWithSoftDelete = [
            'Product', 'Category', 'Review', 'Order', 
            'PromoCode', 'ProductVariant', 'ProductAttribute'
          ];
          
          if (modelsWithSoftDelete.includes(params.model)) {
            if (params.action === 'findUnique' || params.action === 'findFirst') {
              params.args.where.deletedAt = null;
            }
            if (params.action === 'findMany') {
              if (!params.args.where) params.args.where = {};
              params.args.where.deletedAt = null;
            }
          }
        }
        return next(params);
      });
    }
    return this.prisma;
  }

  // Connect to database with retry logic
  async connect(retryAttempts = 3) {
    try {
      if (!this.prisma) {
        this.getPrisma();
      }

      await this.prisma.$connect();
      this.isConnected = true;
      this.retryCount = 0;

      // Test connection with a simple query
      const result = await this.prisma.$queryRaw`SELECT NOW() as current_time, version() as version`;
      const currentTime = result[0]?.current_time || 'N/A';
      const version = result[0]?.version || 'N/A';
      
      logger.info(`✅ PostgreSQL connected successfully`);
      logger.info(`📅 Database time: ${currentTime}`);
      logger.info(`🐘 PostgreSQL version: ${version.substring(0, 30)}...`);
      
      return this.prisma;
    } catch (error) {
      this.isConnected = false;
      logger.error(`❌ PostgreSQL connection failed (Attempt ${this.retryCount + 1}/${retryAttempts})`);
      logger.error(`Error: ${error.message}`);
      
      if (this.retryCount < retryAttempts) {
        this.retryCount++;
        const waitTime = this.retryCount * 2000;
        logger.info(`⏳ Retrying in ${waitTime/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.connect(retryAttempts);
      }
      
      throw new Error(`Failed to connect to PostgreSQL after ${retryAttempts} attempts: ${error.message}`);
    }
  }

  // Disconnect from database
  async disconnect() {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
        this.isConnected = false;
        logger.info('✅ PostgreSQL disconnected successfully');
      }
    } catch (error) {
      logger.error('❌ Error disconnecting from PostgreSQL:', error);
      throw error;
    }
  }

  // Check if database is connected
  isDatabaseConnected() {
    return this.isConnected;
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString()
    };
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database is not connected' };
      }
      
      const result = await this.prisma.$queryRaw`SELECT 1 as health_check`;
      return { 
        status: 'healthy', 
        message: 'Database is operational',
        response: result[0]?.health_check === 1
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error.message,
        error: error.stack
      };
    }
  }

  // Transaction helper
  async transaction(operations) {
    try {
      return await this.prisma.$transaction(operations);
    } catch (error) {
      logger.error('Transaction failed:', error);
      throw error;
    }
  }

  // Execute raw query
  async rawQuery(query, params = []) {
    try {
      return await this.prisma.$queryRaw`${query}`;
    } catch (error) {
      logger.error('Raw query failed:', error);
      throw error;
    }
  }

  // Execute raw query with parameters
  async rawQueryParams(query, params = []) {
    try {
      return await this.prisma.$queryRaw`${query}`;
    } catch (error) {
      logger.error('Raw query with params failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const database = new Database();
const prisma = database.getPrisma();

module.exports = { database, prisma };