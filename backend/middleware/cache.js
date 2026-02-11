/**
 * Cache Middleware
 * Uses node-cache for in-memory caching (Redis alternative)
 */

const cacheService = require('../services/cache-service');

/**
 * Cache middleware factory
 * @param {string} category - Cache category ('stats', 'dashboard', 'charity', 'session')
 * @param {number} ttl - Cache duration in seconds (optional, uses category default)
 * @param {function} keyGenerator - Optional function to generate cache key
 */
const cacheMiddleware = (category = 'dashboard', ttl = null, keyGenerator = null) => {
    return async (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        const cacheKey = keyGenerator
            ? keyGenerator(req)
            : `${req.originalUrl || req.url}:${req.user?.id || 'anonymous'}`;

        try {
            // Try to get cached response
            const cachedData = cacheService.get(category, cacheKey);

            if (cachedData) {
                console.log(`[Cache] HIT: ${category}:${cacheKey}`);
                return res.json(cachedData);
            }

            console.log(`[Cache] MISS: ${category}:${cacheKey}`);

            // Store original res.json
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function (data) {
                // Cache the data
                cacheService.set(category, cacheKey, data, ttl);
                console.log(`[Cache] STORED: ${category}:${cacheKey}`);

                // Send response
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('[Cache] Middleware error:', error);
            // On error, bypass cache
            next();
        }
    };
};

/**
 * Cache invalidation middleware
 * Clears cache when data is modified
 */
const invalidateCache = (category, pattern) => {
    return async (req, res, next) => {
        // Store original functions
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);

        // Override to invalidate cache after successful response
        const wrapResponse = (func) => {
            return function (data) {
                // If response is successful (2xx), invalidate cache
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const cacheKey = typeof pattern === 'function'
                        ? pattern(req)
                        : pattern;

                    if (cacheKey) {
                        cacheService.delete(category, cacheKey);
                        console.log(`[Cache] INVALIDATED: ${category}:${cacheKey}`);
                    }
                }
                return func(data);
            };
        };

        res.json = wrapResponse(originalJson);
        res.send = wrapResponse(originalSend);

        next();
    };
};

module.exports = {
    cacheMiddleware,
    invalidateCache
};
