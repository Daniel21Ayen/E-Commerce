const redisService = require('./redisService');
const { logger } = require('../middleware/logger');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour
    this.longTTL = 86400; // 24 hours
    this.shortTTL = 300; // 5 minutes
    this.sessionTTL = 86400; // 24 hours
    this.prefix = 'cache:';
  }

  /**
   * Get cached data or fetch and cache
   */
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL, options = {}) {
    const { forceRefresh = false, prefix = this.prefix } = options;
    const cacheKey = `${prefix}${key}`;

    if (!forceRefresh) {
      // Try to get from cache
      const cached = await redisService.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    // Fetch fresh data
    logger.debug(`Cache miss: ${cacheKey}`);
    const data = await fetchFunction();

    // Store in cache
    if (data !== null && data !== undefined) {
      await redisService.set(cacheKey, data, ttl);
    }

    return data;
  }

  /**
   * Clear cache by key
   */
  async clear(key, prefix = this.prefix) {
    const cacheKey = `${prefix}${key}`;
    return await redisService.del(cacheKey);
  }

  /**
   * Clear multiple cache entries by pattern
   */
  async clearPattern(pattern, prefix = this.prefix) {
    const fullPattern = `${prefix}${pattern}`;
    return await redisService.deletePattern(fullPattern);
  }

  /**
   * Clear all cache for a specific entity type
   */
  async clearEntityType(entityType, entityId = null) {
    const patterns = [
      `${entityType}:*`,
      `${entityType}:list:*`,
      `${entityType}:${entityId || '*'}:*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await this.clearPattern(pattern);
      totalDeleted += deleted;
    }

    logger.info(`Cleared ${totalDeleted} cache entries for ${entityType}${entityId ? ` (${entityId})` : ''}`);
    return totalDeleted;
  }

  /**
   * Cache product data
   */
  async cacheProduct(productId, data, ttl = this.longTTL) {
    return await this.getOrSet(
      `product:${productId}`,
      async () => data,
      ttl,
      { forceRefresh: true }
    );
  }

  /**
   * Get cached product
   */
  async getCachedProduct(productId) {
    return await redisService.get(`cache:product:${productId}`);
  }

  /**
   * Clear product cache
   */
  async clearProductCache(productId) {
    await this.clear(`product:${productId}`);
    await this.clearPattern('product:list:*');
    await this.clearPattern('product:search:*');
  }

  /**
   * Cache category data
   */
  async cacheCategory(categoryId, data, ttl = this.longTTL) {
    return await this.getOrSet(
      `category:${categoryId}`,
      async () => data,
      ttl,
      { forceRefresh: true }
    );
  }

  /**
   * Get cached category
   */
  async getCachedCategory(categoryId) {
    return await redisService.get(`cache:category:${categoryId}`);
  }

  /**
   * Clear category cache
   */
  async clearCategoryCache(categoryId) {
    await this.clear(`category:${categoryId}`);
    await this.clearPattern('category:list:*');
    await this.clearPattern('category:tree:*');
  }

  /**
   * Cache user data
   */
  async cacheUser(userId, data, ttl = this.sessionTTL) {
    return await this.getOrSet(
      `user:${userId}`,
      async () => data,
      ttl,
      { forceRefresh: true }
    );
  }

  /**
   * Get cached user
   */
  async getCachedUser(userId) {
    return await redisService.get(`cache:user:${userId}`);
  }

  /**
   * Clear user cache
   */
  async clearUserCache(userId) {
    await this.clear(`user:${userId}`);
    await this.clearPattern(`user:${userId}:*`);
  }

  /**
   * Cache order data
   */
  async cacheOrder(orderId, data, ttl = this.longTTL) {
    return await this.getOrSet(
      `order:${orderId}`,
      async () => data,
      ttl,
      { forceRefresh: true }
    );
  }

  /**
   * Get cached order
   */
  async getCachedOrder(orderId) {
    return await redisService.get(`cache:order:${orderId}`);
  }

  /**
   * Clear order cache
   */
  async clearOrderCache(orderId) {
    await this.clear(`order:${orderId}`);
    await this.clearPattern(`order:user:*${orderId}*`);
  }

  /**
   * Cache page data
   */
  async cachePage(page, data, ttl = this.defaultTTL) {
    return await this.getOrSet(
      `page:${page}`,
      async () => data,
      ttl,
      { forceRefresh: true }
    );
  }

  /**
   * Get cached page
   */
  async getCachedPage(page) {
    return await redisService.get(`cache:page:${page}`);
  }

  /**
   * Clear page cache
   */
  async clearPageCache(page) {
    await this.clear(`page:${page}`);
    if (!page) {
      await this.clearPattern('page:*');
    }
  }

  /**
   * Cache search results
   */
  async cacheSearch(query, results, ttl = this.shortTTL) {
    const key = `search:${query}`;
    return await this.getOrSet(
      key,
      async () => results,
      ttl,
      { forceRefresh: true }
    );
  }

  /**
   * Get cached search results
   */
  async getCachedSearch(query) {
    return await redisService.get(`cache:search:${query}`);
  }

  /**
   * Clear search cache
   */
  async clearSearchCache(query = null) {
    if (query) {
      await this.clear(`search:${query}`);
    } else {
      await this.clearPattern('search:*');
    }
  }

  /**
   * Cache with tags
   */
  async cacheWithTags(key, data, tags = [], ttl = this.defaultTTL) {
    const cacheKey = `${this.prefix}${key}`;
    
    // Store data
    await redisService.set(cacheKey, data, ttl);

    // Store tags
    for (const tag of tags) {
      const tagKey = `${this.prefix}tag:${tag}`;
      await redisService.set(`${tagKey}:${key}`, '1', ttl);
    }

    return true;
  }

  /**
   * Get cached by tags
   */
  async getByTag(tag) {
    const tagKey = `${this.prefix}tag:${tag}`;
    const keys = await redisService.keys(`${tagKey}:*`);
    
    const results = [];
    for (const key of keys) {
      const cacheKey = key.replace(`${this.prefix}tag:${tag}:`, '');
      const data = await redisService.get(`${this.prefix}${cacheKey}`);
      if (data !== null) {
        results.push({ key: cacheKey, data });
      }
    }
    
    return results;
  }

  /**
   * Clear cache by tags
   */
  async clearByTag(tag) {
    const tagKey = `${this.prefix}tag:${tag}`;
    const keys = await redisService.keys(`${tagKey}:*`);
    
    for (const key of keys) {
      const cacheKey = key.replace(`${this.prefix}tag:${tag}:`, '');
      await redisService.del(`${this.prefix}${cacheKey}`);
    }
    
    await redisService.deletePattern(`${tagKey}:*`);
    
    logger.info(`Cleared cache for tag: ${tag}, ${keys.length} entries`);
    return keys.length;
  }

  /**
   * Cache statistics
   */
  async getCacheStats() {
    const keys = await redisService.keys(`${this.prefix}*`);
    const tagKeys = await redisService.keys(`${this.prefix}tag:*`);
    
    return {
      totalKeys: keys.length,
      tagKeys: tagKeys.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Warm up cache
   */
  async warmUpCache(items, batchSize = 10) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const promises = batch.map(async (item) => {
        try {
          await this.getOrSet(item.key, item.fetchFunction, item.ttl, { forceRefresh: true });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            key: item.key,
            error: error.message
          });
        }
      });

      await Promise.all(promises);
      
      logger.info(`Cache warm-up progress: ${Math.min(i + batchSize, items.length)}/${items.length}`);
    }

    return results;
  }

  /**
   * Get cache TTL
   */
  async getTTL(key) {
    const cacheKey = `${this.prefix}${key}`;
    return await redisService.getTTL(cacheKey);
  }

  /**
   * Set cache TTL
   */
  async setTTL(key, ttl) {
    const cacheKey = `${this.prefix}${key}`;
    return await redisService.expire(cacheKey, ttl);
  }

  /**
   * Check if cached
   */
  async isCached(key) {
    const cacheKey = `${this.prefix}${key}`;
    return await redisService.exists(cacheKey);
  }

  /**
   * Get multiple cache entries
   */
  async getMultiple(keys) {
    const results = {};
    const cacheKeys = keys.map(k => `${this.prefix}${k}`);
    
    // Use pipeline for better performance
    const pipeline = redisService.client.multi();
    for (const key of cacheKeys) {
      pipeline.get(key);
    }
    
    const responses = await pipeline.exec();
    
    keys.forEach((key, index) => {
      const value = responses[index];
      if (value) {
        try {
          results[key] = JSON.parse(value);
        } catch {
          results[key] = value;
        }
      } else {
        results[key] = null;
      }
    });
    
    return results;
  }

  /**
   * Set multiple cache entries
   */
  async setMultiple(entries, ttl = this.defaultTTL) {
    const pipeline = redisService.client.multi();
    
    for (const [key, value] of Object.entries(entries)) {
      const cacheKey = `${this.prefix}${key}`;
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      pipeline.set(cacheKey, stringValue, { EX: ttl });
    }
    
    await pipeline.exec();
    return Object.keys(entries).length;
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;