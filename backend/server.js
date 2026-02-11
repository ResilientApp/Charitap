// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

console.log("Server starting...");

const express = require('express');
const mongoose = require('mongoose');
const stripeLib = require('stripe');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// SECURITY MIDDLEWARE (Applied First)
// ============================================================================

// 1. Helmet - Security headers
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // For React
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. Additional Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 3. Request ID Tracking
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

// MongoDB Connection with connection pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ============================================================================
// CORS & COMPRESSION
// ============================================================================

// Improved CORS configuration
const corsOptions = require('./config/cors');
const cors = require('cors');
app.use(cors(corsOptions));

// Compression middleware - reduce bandwidth 60-80%
const compression = require('compression');
app.use(compression());

// ============================================================================
// BODY PARSING
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================================================
// LOGGING
// ============================================================================

// Winston logging middleware
const { requestLogger, logger } = require('./config/logger');
app.use(requestLogger);

// ============================================================================
// RATE LIMITING  
// ============================================================================

const rateLimit = require('express-rate-limit');
const { trackViolation } = require('./middleware/rate-limit-alerts');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 15000, // Increased to 15000 (50x) for real-time sync
  message: 'Too many requests, please try again later',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    trackViolation(req.ip, req.url);
    logger.warn({
      type: 'security_event',
      event: 'rate_limit_exceeded',
      ip: req.ip,
      url: req.url,
      requestId: req.id
    });
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250, // 250 attempts per 15 minutes (50x)
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    trackViolation(req.ip, req.url);
    logger.warn({
      type: 'security_event',
      event: 'auth_rate_limit_exceeded',
      ip: req.ip,
      url: req.url,
      requestId: req.id
    });
    res.status(429).json({ error: 'Too many login attempts, please try again later' });
  }
});

// ============================================================================
// CSRF PROTECTION
// ============================================================================

// Store CSRF tokens in memory (for production, use Redis)
const csrfTokens = new Map();

// Generate CSRF token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  const tokenId = crypto.randomBytes(16).toString('hex');

  // Store token with 1 hour expiry
  csrfTokens.set(tokenId, {
    token,
    expires: Date.now() + (60 * 60 * 1000)
  });

  // Clean up expired tokens
  for (const [id, data] of csrfTokens.entries()) {
    if (data.expires < Date.now()) {
      csrfTokens.delete(id);
    }
  }

  // Set cookie with token ID
  res.cookie('csrf-token-id', tokenId, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.json({ csrfToken: token });
});

// CSRF validation middleware
function csrfProtection(req, res, next) {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for Chrome Extension requests (they use JWT auth instead)
  // Extension requests have Authorization header with Bearer token
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('[CSRF] Skipping CSRF check for extension request with JWT token');
    return next();
  }

  const tokenId = req.cookies['csrf-token-id'];
  const token = req.headers['x-csrf-token'];

  if (!tokenId || !token) {
    logger.warn({
      type: 'security_event',
      event: 'csrf_token_missing',
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  const storedData = csrfTokens.get(tokenId);

  if (!storedData || storedData.expires < Date.now()) {
    return res.status(403).json({ error: 'CSRF token expired' });
  }

  if (storedData.token !== token) {
    logger.warn({
      type: 'security_event',
      event: 'csrf_token_invalid',
      ip: req.ip,
      url: req.url
    });
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

// ============================================================================
// CACHING & STRIPE
// ============================================================================

// Initialize in-memory cache service
const cacheService = require('./services/cache-service');
console.log('[Cache] In-memory cache service initialized');

// Stripe setup
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// ============================================================================
// HEALTH & METRICS (Before geo-blocking for monitoring)
// ============================================================================

const { register, metricsMiddleware } = require('./services/metrics');
app.use(metricsMiddleware);

// Health endpoint
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  const status = {
    status: dbStatus === 'healthy' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    database: dbStatus,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
    }
  };
  
  res.status(dbStatus === 'healthy' ? 200 : 503).json(status);
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ============================================================================
// GEO-BLOCKING
// ============================================================================

// Geo-blocking middleware (after health/metrics)
const geoBlock = require('./middleware/geoblock');
app.use(geoBlock);

// ============================================================================
// ROUTES
// ============================================================================

// Import routes
const authRoutes = require('./routes/authRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const roundUpRoutes = require('./routes/roundUpRoutes');
const charityRoutes = require('./routes/charityRoutes');

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// API routes with rate limiting and CSRF protection
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', csrfProtection, stripeRoutes);
app.use('/api/roundup', csrfProtection, roundUpRoutes);
app.use('/api/charities', charityRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  logger.warn({
    type: 'not_found',
    method: req.method,
    url: req.url,
    ip: req.ip,
    requestId: req.id
  });
  res.status(404).json({ error: 'Not found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  // Log full error details
  logger.error({
    type: 'error',
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    requestId: req.id
  });

  // Don't expose internal errors to client in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An error occurred'
    : err.message;

  res.status(statusCode).json({
    error: message,
    requestId: req.id
  });
});

// ============================================================================
// START SERVER
// ============================================================================

// Start the cron processor for automated payments
require('./cronProcessor');

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log('Security features enabled:');
  console.log('  ✅ Helmet (CSP, security headers)');
  console.log('  ✅ Rate limiting (15000 req/15min general, 250 req/15min auth)');
  console.log('  ✅ CSRF protection');
  console.log('  ✅ Geo-blocking');
  console.log('  ✅ Request ID tracking');
  console.log('  ✅ Winston logging');
  console.log('  ✅ Metrics & health checks');
  console.log('  ✅ Compression enabled');
});