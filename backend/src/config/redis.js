const redis = require('redis');
const { logger } = require('../middleware/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isReady = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.connectionAttempts = 0;
  }

  // Get Redis configuration
  getConfig() {
    return {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DATABASE) || 0,
      socket: {
        reconnectStrategy: this.reconnectStrategy.bind(this),
        connectTimeout: 10000,
        keepAlive: 30000,
        tls: process.env.REDIS_TLS === 'true' || false
      },
      pingInterval: 30000,
      retryDelay: 2000
    };
  }

  // Reconnection strategy
  reconnectStrategy(retries) {
    this.retryCount = retries;
    
    if (retries > this.maxRetries) {
      logger.error(`Redis connection retry limit reached (${this.maxRetries} attempts)`);
      return new Error('Redis connection retry limit reached');
    }
    
    const delay = Math.min(retries * 2000, 10000);
    logger.info(`Redis reconnect attempt ${retries + 1}/${this.maxRetries} in ${delay/1000}s`);
    return delay;
  }

  // Connect to Redis
  async connect() {
    try {
      if (this.client && this.isConnected) {
        logger.info('Redis already connected');
        return this.client;
      }

      const config = this.getConfig();
      
      // Create Redis client
      this.client = redis.createClient(config);

      // Event handlers
      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err.message);
        this.isConnected = false;
        this.isReady = false;
        
        // Attempt to reconnect if not already reconnecting
        if (!this.client.isOpen) {
          logger.info('Attempting to reconnect to Redis...');
          setTimeout(() => this.connect(), 5000);
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
        this.connectionAttempts++;
      });

      this.client.on('ready', () => {
        logger.info('Redis Client Ready');
        this.isConnected = true;
        this.isReady = true;
        this.retryCount = 0;
        
        // Test Redis connection
        this.testConnection().then(() => {
          logger.info('✅ Redis connection test successful');
        }).catch((err) => {
          logger.warn('Redis connection test failed:', err.message);
        });
      });

      this.client.on('end', () => {
        logger.info('Redis Client Connection Ended');
        this.isConnected = false;
        this.isReady = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis Client Reconnecting...');
        this.isConnected = false;
        this.isReady = false;
      });

      // Connect to Redis
      await this.client.connect();
      this.isConnected = true;
      
      logger.info('✅ Redis connected successfully');
      return this.client;
      
    } catch (error) {
      logger.error('❌ Redis connection error:', error.message);
      this.isConnected = false;
      this.isReady = false;
      
      // If connection fails, don't throw error - allow app to continue without cache
      logger.warn('⚠️  Redis is not available, continuing without caching...');
      return null;
    }
  }

  // Test Redis connection
  async testConnection() {
    try {
      if (!this.isConnected || !this.client) {
        throw new Error('Redis not connected');
      }
      
      const testKey = 'test_connection_' + Date.now();
      await this.client.set(testKey, 'ok', { EX: 10 });
      const result = await this.client.get(testKey);
      await this.client.del(testKey);
      
      return result === 'ok';
    } catch (error) {
      logger.error('Redis test failed:', error.message);
      return false;
    }
  }

  // Set value with expiration
  async set(key, value, expireSeconds = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        logger.warn('Redis not connected, skipping set');
        return null;
      }
      
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.set(key, stringValue, { EX: expireSeconds });
      return true;
    } catch (error) {
      logger.error('Redis set error:', error.message);
      return null;
    }
  }

  // Get value
  async get(key) {
    try {
      if (!this.isConnected || !this.client) {
        logger.warn('Redis not connected, skipping get');
        return null;
      }
      
      const value = await this.client.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis get error:', error.message);
      return null;
    }
  }

  // Delete key
  async del(key) {
    try {
      if (!this.isConnected || !this.client) {
        logger.warn('Redis not connected, skipping delete');
        return null;
      }
      
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error.message);
      return null;
    }
  }

  // Delete multiple keys
  async delMultiple(keys) {
    try {
      if (!this.isConnected || !this.client || !keys.length) {
        return null;
      }
      
      await this.client.del(keys);
      return true;
    } catch (error) {
      logger.error('Redis delMultiple error:', error.message);
      return null;
    }
  }

  // Clear all keys
  async clear() {
    try {
      if (!this.isConnected || !this.client) {
        logger.warn('Redis not connected, skipping clear');
        return null;
      }
      
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Redis clear error:', error.message);
      return null;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error.message);
      return false;
    }
  }

  // Set expiration on key
  async expire(key, seconds) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }
      
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error.message);
      return false;
    }
  }

  // Get all keys matching pattern
  async keys(pattern) {
    try {
      if (!this.isConnected || !this.client) {
        return [];
      }
      
      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      logger.error('Redis keys error:', error.message);
      return [];
    }
  }

  // Delete keys matching pattern
  async deletePattern(pattern) {
    try {
      if (!this.isConnected || !this.client) {
        return 0;
      }
      
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      
      await this.delMultiple(keys);
      return keys.length;
    } catch (error) {
      logger.error('Redis deletePattern error:', error.message);
      return 0;
    }
  }

  // Increment counter
  async increment(key, amount = 1) {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }
      
      const result = await this.client.incrBy(key, amount);
      return result;
    } catch (error) {
      logger.error('Redis increment error:', error.message);
      return null;
    }
  }

  // Decrement counter
  async decrement(key, amount = 1) {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }
      
      const result = await this.client.decrBy(key, amount);
      return result;
    } catch (error) {
      logger.error('Redis decrement error:', error.message);
      return null;
    }
  }

  // Get TTL of key
  async getTTL(key) {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }
      
      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error) {
      logger.error('Redis getTTL error:', error.message);
      return null;
    }
  }

  // Cache with get or set pattern
  async cache(key, callback, expireSeconds = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, execute callback
      const result = await callback();
      
      // Store in cache
      if (result !== null && result !== undefined) {
        await this.set(key, result, expireSeconds);
      }
      
      return result;
    } catch (error) {
      logger.error('Redis cache error:', error.message);
      return await callback(); // Fallback to callback
    }
  }

  // Batch operations
  async batch(operations) {
    try {
      if (!this.isConnected || !this.client) {
        logger.warn('Redis not connected, skipping batch operations');
        return null;
      }
      
      const multi = this.client.multi();
      
      for (const op of operations) {
        switch (op.type) {
          case 'set':
            multi.set(op.key, op.value);
            if (op.expire) multi.expire(op.key, op.expire);
            break;
          case 'get':
            multi.get(op.key);
            break;
          case 'del':
            multi.del(op.key);
            break;
          case 'incr':
            multi.incrBy(op.key, op.amount || 1);
            break;
          case 'decr':
            multi.decrBy(op.key, op.amount || 1);
            break;
          case 'exists':
            multi.exists(op.key);
            break;
          default:
            logger.warn(`Unknown batch operation type: ${op.type}`);
        }
      }
      
      const results = await multi.exec();
      return results;
    } catch (error) {
      logger.error('Redis batch error:', error.message);
      return null;
    }
  }

  // Get client instance
  getClient() {
    return this.client;
  }

  // Check if Redis is ready
  isReady() {
    return this.isConnected && this.isReady && this.client?.isOpen;
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      ready: this.isReady,
      retryCount: this.retryCount,
      connectionAttempts: this.connectionAttempts,
      timestamp: new Date().toISOString()
    };
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) {
        return { 
          status: 'disconnected', 
          message: 'Redis is not connected',
          details: {
            isConnected: this.isConnected,
            isReady: this.isReady
          }
        };
      }
      
      // Ping Redis
      const result = await this.client.ping();
      
      if (result === 'PONG') {
        return { 
          status: 'healthy', 
          message: 'Redis is operational',
          details: {
            isConnected: this.isConnected,
            isReady: this.isReady,
            ping: 'PONG'
          }
        };
      } else {
        return { 
          status: 'unhealthy', 
          message: 'Redis ping failed',
          details: { result }
        };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error.message,
        details: {
          isConnected: this.isConnected,
          isReady: this.isReady,
          error: error.stack
        }
      };
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;