/**
 * In-Memory Cache Service
 * Lightweight alternative to Redis for development
 * Uses node-cache for TTL-based caching
 */

const NodeCache = require('node-cache');

class CacheService {
    constructor() {
        // Stats cache: 5 minutes TTL
        this.statsCache = new NodeCache({
            stdTTL: 300,
            checkperiod: 60,
            useClones: false // Better performance
        });

        // Dashboard data cache: 2 minutes TTL
        this.dashboardCache = new NodeCache({
            stdTTL: 120,
            checkperiod: 30,
            useClones: false
        });

        // Charity list cache: 10 minutes TTL
        this.charityCache = new NodeCache({
            stdTTL: 600,
            checkperiod: 120,
            useClones: false
        });

        // User session cache: 30 minutes TTL
        this.sessionCache = new NodeCache({
            stdTTL: 1800,
            checkperiod: 300,
            useClones: false
        });

        console.log('[Cache] In-memory cache service initialized');
    }

    // ===== STATS CACHING =====

    getCachedStats(userId) {
        const key = `stats:${userId}`;
        return this.statsCache.get(key);
    }

    setCachedStats(userId, data) {
        const key = `stats:${userId}`;
        return this.statsCache.set(key, data);
    }

    invalidateStats(userId) {
        const key = `stats:${userId}`;
        return this.statsCache.del(key);
    }

    // ===== DASHBOARD CACHING =====

    getCachedDashboard(userId) {
        const key = `dashboard:${userId}`;
        return this.dashboardCache.get(key);
    }

    setCachedDashboard(userId, data) {
        const key = `dashboard:${userId}`;
        return this.dashboardCache.set(key, data);
    }

    invalidateDashboard(userId) {
        const key = `dashboard:${userId}`;
        return this.dashboardCache.del(key);
    }

    //  ===== CHARITY CACHING =====

    getCachedCharities() {
        return this.charityCache.get('charities:all');
    }

    setCachedCharities(data) {
        return this.charityCache.set('charities:all', data);
    }

    getCachedCharity(charityId) {
        const key = `charity:${charityId}`;
        return this.charityCache.get(key);
    }

    setCachedCharity(charityId, data) {
        const key = `charity:${charityId}`;
        return this.charityCache.set(key, data);
    }

    invalidateCharities() {
        this.charityCache.flushAll();
    }

    // ===== SESSION CACHING =====

    getCachedSession(token) {
        const key = `session:${token}`;
        return this.sessionCache.get(key);
    }

    setCachedSession(token, userData) {
        const key = `session:${token}`;
        return this.sessionCache.set(key, userData);
    }

    invalidateSession(token) {
        const key = `session:${token}`;
        return this.sessionCache.del(key);
    }

    // ===== UTILITY METHODS =====

    getStats() {
        return {
            stats: this.statsCache.getStats(),
            dashboard: this.dashboardCache.getStats(),
            charity: this.charityCache.getStats(),
            session: this.sessionCache.getStats()
        };
    }

    flushAll() {
        this.statsCache.flushAll();
        this.dashboardCache.flushAll();
        this.charityCache.flushAll();
        this.sessionCache.flushAll();
        console.log('[Cache] All caches flushed');
    }

    // Generic get/set with custom TTL
    get(category, key) {
        const cache = this[`${category}Cache`];
        return cache ? cache.get(key) : null;
    }

    set(category, key, value, ttl) {
        const cache = this[`${category}Cache`];
        if (!cache) return false;
        return ttl ? cache.set(key, value, ttl) : cache.set(key, value);
    }

    delete(category, key) {
        const cache = this[`${category}Cache`];
        return cache ? cache.del(key) : false;
    }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
