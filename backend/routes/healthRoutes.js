/**
 * Health Check Routes
 * Provides system health monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cacheService = require('../services/cache-service');
let resilientdb = null;
try {
    resilientdb = require('../services/resilientdb-client');
} catch (e) {
    // Ignore early require failure and rely on resilientdb = null
}

/**
 * GET /
 * Basic health check - returns system status
 */
router.get('/', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {}
    };

    // Check MongoDB
    try {
        const mongoState = mongoose.connection.readyState;
        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        health.services.mongodb = {
            status: mongoState === 1 ? 'healthy' : 'unhealthy',
            state: stateMap[mongoState] || 'unknown'
        };

        // Ping database for response time with 2-second timeout
        if (mongoState === 1 && mongoose.connection.db) {
            const startTime = Date.now();
            await Promise.race([
                mongoose.connection.db.admin().ping(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 2000))
            ]);
            health.services.mongodb.responseTime = `${Date.now() - startTime}ms`;
        }
    } catch (error) {
        health.services.mongodb = {
            status: 'unhealthy',
            error: error.message
        };
        health.status = 'degraded';
    }

    // Check Cache Service (node-cache)
    try {
        const cacheStats = cacheService.getStats();
        health.services.cache = {
            status: 'healthy',
            type: 'in-memory (node-cache)',
            stats: {
                stats: cacheStats.stats || {},
                dashboard: cacheStats.dashboard || {},
                charity: cacheStats.charity || {},
                session: cacheStats.session || {}
            }
        };
    } catch (error) {
        health.services.cache = {
            status: 'degraded',
        };
        health.status = 'degraded';
    }

    // Check ResilientDB
    try {
        health.services.resilientdb = {
            status: 'info',
            enabled: resilientdb ? (resilientdb.enabled || false) : false
        };
    } catch (error) {
        health.services.resilientdb = {
            status: 'info',
            enabled: false
        };
    }

    // Set appropriate status code
    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;
    res.status(statusCode).json(health);
});

/**
 * GET /ready
 * Readiness check - returns 200 if app is ready to serve traffic
 */
router.get('/ready', async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                ready: false,
                reason: 'MongoDB not connected'
            });
        }

        // App is ready
        res.json({ ready: true });
    } catch (error) {
        res.status(503).json({
            ready: false,
            error: error.message
        });
    }
});

/**
 * GET /live
 * Liveness check - returns 200 if app is alive (even if degraded)
 */
router.get('/live', (req, res) => {
    res.json({
        alive: true,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
