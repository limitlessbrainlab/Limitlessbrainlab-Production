/**
 * Performance Optimization Service
 * Points 12-15: API Optimization, DB Optimization, Caching, Load Testing
 */

const logger = require('./logger');

/**
 * Query optimizer - tracks slow queries
 */
class QueryOptimizer {
  constructor() {
    this.slowQueries = [];
    this.slowQueryThreshold = 1000; // ms
  }

  /**
   * Track query performance
   */
  trackQuery(query, duration, params = {}) {
    if (duration > this.slowQueryThreshold) {
      this.slowQueries.push({
        query: query.substring(0, 100),
        duration,
        timestamp: new Date(),
        params
      });

      logger.warn('Slow query detected', {
        query: query.substring(0, 50),
        duration: `${duration}ms`,
        threshold: `${this.slowQueryThreshold}ms`
      });

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }
    }
  }

  /**
   * Get slow queries report
   */
  getReport() {
    return {
      totalSlowQueries: this.slowQueries.length,
      queries: this.slowQueries,
      avgDuration: this.slowQueries.length > 0
        ? Math.round(this.slowQueries.reduce((sum, q) => sum + q.duration, 0) / this.slowQueries.length)
        : 0
    };
  }
}

/**
 * Response cache - simple in-memory cache
 */
class ResponseCache {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
  }

  /**
   * Set cache value
   */
  set(key, value, ttlSeconds = 3600) {
    this.cache.set(key, value);

    // Clear old timeout
    if (this.ttlMap.has(key)) {
      clearTimeout(this.ttlMap.get(key));
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.ttlMap.delete(key);
    }, ttlSeconds * 1000);

    this.ttlMap.set(key, timeout);
  }

  /**
   * Get cached value
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    if (this.ttlMap.has(key)) {
      clearTimeout(this.ttlMap.get(key));
      this.ttlMap.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.ttlMap.forEach(timeout => clearTimeout(timeout));
    this.cache.clear();
    this.ttlMap.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * API optimizer - tracks response times
 */
class ApiOptimizer {
  constructor() {
    this.endpoints = new Map();
  }

  /**
   * Track endpoint performance
   */
  trackEndpoint(method, path, duration) {
    const key = `${method} ${path}`;

    if (!this.endpoints.has(key)) {
      this.endpoints.set(key, {
        method,
        path,
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      });
    }

    const stats = this.endpoints.get(key);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = Math.round(stats.totalDuration / stats.count);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.minDuration = Math.min(stats.minDuration, duration);

    // Log if response time is high
    if (duration > 5000) {
      logger.warn('Slow API endpoint', {
        endpoint: key,
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Get performance report
   */
  getReport() {
    return Array.from(this.endpoints.values())
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 20); // Top 20 slowest
  }

  /**
   * Get endpoint stats
   */
  getStats(method, path) {
    return this.endpoints.get(`${method} ${path}`);
  }
}

/**
 * Database connection pool optimizer
 */
class ConnectionPoolOptimizer {
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.waitingQueue = 0;
  }

  /**
   * Acquire connection
   */
  acquireConnection() {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return true;
    }
    this.waitingQueue++;
    return false;
  }

  /**
   * Release connection
   */
  releaseConnection() {
    if (this.activeConnections > 0) {
      this.activeConnections--;
    }
    if (this.waitingQueue > 0) {
      this.waitingQueue--;
    }
  }

  /**
   * Get pool stats
   */
  getStats() {
    return {
      maxConnections: this.maxConnections,
      activeConnections: this.activeConnections,
      availableConnections: this.maxConnections - this.activeConnections,
      waitingQueue: this.waitingQueue,
      utilizationPercent: Math.round((this.activeConnections / this.maxConnections) * 100)
    };
  }
}

/**
 * Create middleware for API optimization tracking
 */
const createPerformanceMiddleware = (optimizer) => {
  return (req, res, next) => {
    const start = Date.now();

    // Track response
    res.on('finish', () => {
      const duration = Date.now() - start;
      optimizer.trackEndpoint(req.method, req.path, duration);
    });

    next();
  };
};

// Export singleton instances
const queryOptimizer = new QueryOptimizer();
const responseCache = new ResponseCache();
const apiOptimizer = new ApiOptimizer();
const connectionPool = new ConnectionPoolOptimizer();

module.exports = {
  QueryOptimizer,
  ResponseCache,
  ApiOptimizer,
  ConnectionPoolOptimizer,
  createPerformanceMiddleware,
  queryOptimizer,
  responseCache,
  apiOptimizer,
  connectionPool
};
