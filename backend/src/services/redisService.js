const redis = require('../config/redis');
const { logger } = require('../middleware/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
    this.prefix = 'ecom:';
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      if (!this.client) {
        this.client = await redis.connect();
        this.isConnected = redis.isConnected;
      }
      return this.client;
    } catch (error) {
      logger.error('Redis service initialization error:', error);
      throw error;
    }
  }

  /**
   * Get Redis client
   */
  getClient() {
    return redis.getClient();
  }

  /**
   * Check if Redis is connected
   */
  isReady() {
    return redis.isReady();
  }

  /**
   * Get connection status
   */
  getStatus() {
    return redis.getStatus();
  }

  /**
   * Health check
   */
  async healthCheck() {
    return redis.healthCheck();
  }

  /**
   * Set value with key
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const fullKey = this.getKey(key);
      return await redis.set(fullKey, value, ttl);
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  /**
   * Get value by key
   */
  async get(key) {
    try {
      const fullKey = this.getKey(key);
      return await redis.get(fullKey);
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  /**
   * Delete key
   */
  async del(key) {
    try {
      const fullKey = this.getKey(key);
      return await redis.del(fullKey);
    } catch (error) {
      logger.error('Redis del error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple keys
   */
  async delMultiple(keys) {
    try {
      const fullKeys = keys.map(k => this.getKey(k));
      return await redis.delMultiple(fullKeys);
    } catch (error) {
      logger.error('Redis delMultiple error:', error);
      throw error;
    }
  }

  /**
   * Clear all keys
   */
  async clear() {
    try {
      return await redis.clear();
    } catch (error) {
      logger.error('Redis clear error:', error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const fullKey = this.getKey(key);
      return await redis.exists(fullKey);
    } catch (error) {
      logger.error('Redis exists error:', error);
      throw error;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key, seconds) {
    try {
      const fullKey = this.getKey(key);
      return await redis.expire(fullKey, seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
      throw error;
    }
  }

  /**
   * Get TTL of key
   */
  async getTTL(key) {
    try {
      const fullKey = this.getKey(key);
      return await redis.getTTL(fullKey);
    } catch (error) {
      logger.error('Redis getTTL error:', error);
      throw error;
    }
  }

  /**
   * Increment counter
   */
  async increment(key, amount = 1) {
    try {
      const fullKey = this.getKey(key);
      return await redis.increment(fullKey, amount);
    } catch (error) {
      logger.error('Redis increment error:', error);
      throw error;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key, amount = 1) {
    try {
      const fullKey = this.getKey(key);
      return await redis.decrement(fullKey, amount);
    } catch (error) {
      logger.error('Redis decrement error:', error);
      throw error;
    }
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern) {
    try {
      const fullPattern = this.getKey(pattern);
      return await redis.keys(fullPattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      throw error;
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern) {
    try {
      const fullPattern = this.getKey(pattern);
      return await redis.deletePattern(fullPattern);
    } catch (error) {
      logger.error('Redis deletePattern error:', error);
      throw error;
    }
  }

  /**
   * Cache with get or set pattern
   */
  async cache(key, callback, ttl = this.defaultTTL) {
    try {
      const fullKey = this.getKey(key);
      return await redis.cache(fullKey, callback, ttl);
    } catch (error) {
      logger.error('Redis cache error:', error);
      return await callback();
    }
  }

  /**
   * Batch operations
   */
  async batch(operations) {
    try {
      // Add prefix to keys in operations
      const prefixedOps = operations.map(op => ({
        ...op,
        key: this.getKey(op.key)
      }));
      return await redis.batch(prefixedOps);
    } catch (error) {
      logger.error('Redis batch error:', error);
      throw error;
    }
  }

  /**
   * Get full key with prefix
   */
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set prefix
   */
  setPrefix(prefix) {
    this.prefix = prefix;
  }

  /**
   * Session management
   */
  async setSession(sessionId, data, ttl = 86400) {
    return this.set(`session:${sessionId}`, data, ttl);
  }

  async getSession(sessionId) {
    return this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId) {
    return this.del(`session:${sessionId}`);
  }

  /**
   * Cache management
   */
  async cacheProduct(productId, data, ttl = 3600) {
    return this.set(`product:${productId}`, data, ttl);
  }

  async getCachedProduct(productId) {
    return this.get(`product:${productId}`);
  }

  async cacheCategory(categoryId, data, ttl = 3600) {
    return this.set(`category:${categoryId}`, data, ttl);
  }

  async getCachedCategory(categoryId) {
    return this.get(`category:${categoryId}`);
  }

  async invalidateProductCache(productId) {
    await this.del(`product:${productId}`);
    await this.deletePattern('products:list:*');
  }

  async invalidateCategoryCache(categoryId) {
    await this.del(`category:${categoryId}`);
    await this.deletePattern('categories:list:*');
  }

  /**
   * Rate limiting
   */
  async rateLimit(key, limit, window = 60) {
    const current = await this.increment(`rate:${key}`);
    if (current === 1) {
      await this.expire(`rate:${key}`, window);
    }
    return current <= limit;
  }

  async getRateLimitInfo(key) {
    const count = await this.get(`rate:${key}`);
    const ttl = await this.getTTL(`rate:${key}`);
    return {
      count: parseInt(count) || 0,
      ttl,
      remaining: ttl > 0 ? this.limit - (parseInt(count) || 0) : 0
    };
  }

  /**
   * Queue management
   */
  async pushToQueue(queueName, item) {
    const key = `queue:${queueName}`;
    await this.client.rPush(key, JSON.stringify(item));
  }

  async popFromQueue(queueName) {
    const key = `queue:${queueName}`;
    const item = await this.client.lPop(key);
    return item ? JSON.parse(item) : null;
  }

  async getQueueLength(queueName) {
    const key = `queue:${queueName}`;
    return await this.client.lLen(key);
  }

  async getQueueItems(queueName, start = 0, end = -1) {
    const key = `queue:${queueName}`;
    const items = await this.client.lRange(key, start, end);
    return items.map(item => JSON.parse(item));
  }

  /**
   * Lock management
   */
  async acquireLock(lockKey, ttl = 10000) {
    const key = `lock:${lockKey}`;
    const result = await this.client.set(key, 'locked', { 
      NX: true, 
      PX: ttl 
    });
    return result === 'OK';
  }

  async releaseLock(lockKey) {
    const key = `lock:${lockKey}`;
    await this.del(key);
  }

  /**
   * Pub/Sub
   */
  async publish(channel, message) {
    await this.client.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel, callback) {
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        callback(parsed);
      } catch (error) {
        logger.error('Error parsing pub/sub message:', error);
      }
    });
    return subscriber;
  }

  async unsubscribe(subscriber, channel) {
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
  }

  /**
   * Geo operations
   */
  async geoAdd(key, longitude, latitude, member) {
    const fullKey = this.getKey(key);
    await this.client.geoAdd(fullKey, {
      longitude,
      latitude,
      member
    });
  }

  async geoSearch(key, longitude, latitude, radius, unit = 'km') {
    const fullKey = this.getKey(key);
    const results = await this.client.geoSearch(
      fullKey,
      { longitude, latitude },
      { radius, unit }
    );
    return results;
  }

  /**
   * HyperLogLog (for unique visitors)
   */
  async pfAdd(key, element) {
    const fullKey = this.getKey(key);
    await this.client.pfAdd(fullKey, element);
  }

  async pfCount(key) {
    const fullKey = this.getKey(key);
    return await this.client.pfCount(fullKey);
  }

  /**
   * Bitmap operations (for daily active users)
   */
  async setBit(key, offset, value) {
    const fullKey = this.getKey(key);
    await this.client.setBit(fullKey, offset, value);
  }

  async getBit(key, offset) {
    const fullKey = this.getKey(key);
    return await this.client.getBit(fullKey, offset);
  }

  async bitCount(key) {
    const fullKey = this.getKey(key);
    return await this.client.bitCount(fullKey);
  }

  /**
   * Sorted Sets (for leaderboards)
   */
  async zAdd(key, score, member) {
    const fullKey = this.getKey(key);
    await this.client.zAdd(fullKey, { score, value: member });
  }

  async zRange(key, start, stop, withScores = false) {
    const fullKey = this.getKey(key);
    const options = withScores ? { WITHSCORES: true } : {};
    return await this.client.zRange(fullKey, start, stop, options);
  }

  async zRevRange(key, start, stop, withScores = false) {
    const fullKey = this.getKey(key);
    const options = withScores ? { WITHSCORES: true } : {};
    return await this.client.zRevRange(fullKey, start, stop, options);
  }

  async zScore(key, member) {
    const fullKey = this.getKey(key);
    return await this.client.zScore(fullKey, member);
  }

  async zRank(key, member) {
    const fullKey = this.getKey(key);
    return await this.client.zRank(fullKey, member);
  }

  async zRevRank(key, member) {
    const fullKey = this.getKey(key);
    return await this.client.zRevRank(fullKey, member);
  }

  async zRem(key, member) {
    const fullKey = this.getKey(key);
    await this.client.zRem(fullKey, member);
  }

  /**
   * Hash operations
   */
  async hSet(key, field, value) {
    const fullKey = this.getKey(key);
    await this.client.hSet(fullKey, field, JSON.stringify(value));
  }

  async hGet(key, field) {
    const fullKey = this.getKey(key);
    const value = await this.client.hGet(fullKey, field);
    return value ? JSON.parse(value) : null;
  }

  async hGetAll(key) {
    const fullKey = this.getKey(key);
    const hash = await this.client.hGetAll(fullKey);
    const result = {};
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }
    return result;
  }

  async hDel(key, field) {
    const fullKey = this.getKey(key);
    await this.client.hDel(fullKey, field);
  }

  async hIncrBy(key, field, increment) {
    const fullKey = this.getKey(key);
    return await this.client.hIncrBy(fullKey, field, increment);
  }

  /**
   * List operations
   */
  async lPush(key, value) {
    const fullKey = this.getKey(key);
    await this.client.lPush(fullKey, JSON.stringify(value));
  }

  async rPush(key, value) {
    const fullKey = this.getKey(key);
    await this.client.rPush(fullKey, JSON.stringify(value));
  }

  async lPop(key) {
    const fullKey = this.getKey(key);
    const value = await this.client.lPop(fullKey);
    return value ? JSON.parse(value) : null;
  }

  async rPop(key) {
    const fullKey = this.getKey(key);
    const value = await this.client.rPop(fullKey);
    return value ? JSON.parse(value) : null;
  }

  async lRange(key, start, stop) {
    const fullKey = this.getKey(key);
    const items = await this.client.lRange(fullKey, start, stop);
    return items.map(item => {
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    });
  }

  async lLen(key) {
    const fullKey = this.getKey(key);
    return await this.client.lLen(fullKey);
  }

  async lRem(key, count, value) {
    const fullKey = this.getKey(key);
    await this.client.lRem(fullKey, count, JSON.stringify(value));
  }
}

// Create singleton instance
const redisService = new RedisService();

// Initialize Redis
redisService.initialize().catch(err => {
  logger.error('Failed to initialize Redis service:', err);
});

module.exports = redisService;