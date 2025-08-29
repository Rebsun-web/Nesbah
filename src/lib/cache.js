import pool from './db.cjs';

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map();
        this.defaultTTL = 300000; // 5 minutes in milliseconds
    }

    // Set cache with TTL
    set(key, value, ttl = this.defaultTTL) {
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttl);
    }

    // Get cache value
    get(key) {
        const expiry = this.ttl.get(key);
        if (!expiry || Date.now() > expiry) {
            this.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    // Delete cache entry
    delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        this.ttl.clear();
    }

    // Get cache size
    size() {
        return this.cache.size;
    }

    // Get cache stats
    getStats() {
        const now = Date.now();
        let expired = 0;
        let valid = 0;

        for (const [key, expiry] of this.ttl.entries()) {
            if (now > expiry) {
                expired++;
            } else {
                valid++;
            }
        }

        return {
            total: this.cache.size,
            valid,
            expired,
            memoryUsage: process.memoryUsage()
        };
    }

    // Cache database query results
    async cachedQuery(query, params = [], ttl = this.defaultTTL, cacheKey = null) {
        const key = cacheKey || this.generateCacheKey(query, params);
        
        // Check cache first
        const cached = this.get(key);
        if (cached) {
            return cached;
        }

        // Execute query
        const client = await pool.connectWithRetry();
        try {
            const result = await client.query(query, params);
            const data = result.rows;
            
            // Cache the result
            this.set(key, data, ttl);
            
            return data;
        } finally {
            client.release();
        }
    }

    // Generate cache key from query and parameters
    generateCacheKey(query, params) {
        return `query:${Buffer.from(query).toString('base64')}:${JSON.stringify(params)}`;
    }

    // Invalidate cache by pattern
    invalidatePattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.delete(key);
            }
        }
    }

    // Cache user-specific data
    async getUserCache(userId, dataType, ttl = 300000) {
        const key = `user:${userId}:${dataType}`;
        return this.get(key);
    }

    // Set user-specific cache
    setUserCache(userId, dataType, data, ttl = 300000) {
        const key = `user:${userId}:${dataType}`;
        this.set(key, data, ttl);
    }

    // Invalidate user cache
    invalidateUserCache(userId, dataType = null) {
        if (dataType) {
            const key = `user:${userId}:${dataType}`;
            this.delete(key);
        } else {
            // Invalidate all user cache
            this.invalidatePattern(`user:${userId}:`);
        }
    }

    // Cache application data
    async getApplicationCache(applicationId, ttl = 600000) { // 10 minutes for application data
        const key = `application:${applicationId}`;
        return this.get(key);
    }

    setApplicationCache(applicationId, data, ttl = 600000) {
        const key = `application:${applicationId}`;
        this.set(key, data, ttl);
    }

    invalidateApplicationCache(applicationId) {
        const key = `application:${applicationId}`;
        this.delete(key);
    }

    // Cache stats data
    async getStatsCache(userId, ttl = 120000) { // 2 minutes for stats
        const key = `stats:${userId}`;
        return this.get(key);
    }

    setStatsCache(userId, data, ttl = 120000) {
        const key = `stats:${userId}`;
        this.set(key, data, ttl);
    }

    invalidateStatsCache(userId) {
        const key = `stats:${userId}`;
        this.delete(key);
    }

    // Cache admin dashboard data
    async getAdminDashboardCache(ttl = 300000) { // 5 minutes for admin data
        const key = 'admin:dashboard';
        return this.get(key);
    }

    setAdminDashboardCache(data, ttl = 300000) {
        const key = 'admin:dashboard';
        this.set(key, data, ttl);
    }

    invalidateAdminDashboardCache() {
        const key = 'admin:dashboard';
        this.delete(key);
    }

    // Periodic cache cleanup
    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            let cleaned = 0;
            
            for (const [key, expiry] of this.ttl.entries()) {
                if (now > expiry) {
                    this.delete(key);
                    cleaned++;
                }
            }
            
            if (cleaned > 0) {
                console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
            }
        }, 60000); // Clean up every minute
    }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Start cleanup process
cacheManager.startCleanup();

export default cacheManager;
