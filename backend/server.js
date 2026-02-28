// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

console.log("Server starting...");

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripeLib = require('stripe');
const xss = require('xss');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection (using MongoDB URI from .env)
const server = app.listen(0); // placeholder, actual listen below
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Only start the HTTP server after a successful DB connection
    if (require.main === module) {
      server.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));
      server.close(); // close placeholder
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  });

// CORS - only allow explicitly whitelisted origins
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGIN_EXTRA,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // server-to-server requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Custom XSS Sanitizer for Express 5 compatibility
const sanitizeObject = (data) => {
  if (typeof data === 'string') {
    // Sanitize XSS (NoSQL operators in keys are handled below)
    return xss(data);
  }
  if (Array.isArray(data)) return data.map(v => sanitizeObject(v));
  if (data !== null && typeof data === 'object') {
    Object.keys(data).forEach(key => {
      // Prevent NoSQL injection in object keys
      if (key.startsWith('$') || key.includes('.')) {
        const cleanKey = key.replace(/[$\.]/g, '_');
        data[cleanKey] = sanitizeObject(data[key]);
        delete data[key];
      } else {
        data[key] = sanitizeObject(data[key]);
      }
    });
  }
  return data;
};

// Apply sanitization safely without re-assigning read-only `req.query` in Express 5
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  // Express 5 makes req.query immutable via a getter, so we just iterate its keys 
  // directly without re-assigning the base wrapper object.
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizeObject(req.query[key]);
    });
  }
  next();
});

// Stripe setup - USD only
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// Import routes
const authRoutes = require('./routes/authRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const roundUpRoutes = require('./routes/roundUpRoutes');
const charityRoutes = require('./routes/charityRoutes');
const charityNominationRoutes = require('./routes/charityNominationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/roundup', roundUpRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/charity-nominations', charityNominationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the cron processor for automated payments
// NOTE: In production (Vercel), cron is handled by /api/cron/process-roundups.js
// The node-cron below runs only in local dev / non-Vercel environments
if (process.env.NODE_ENV !== 'production') {
  require('./cronProcessor');
}

// Start the server (local dev only — Vercel uses the exported app)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless (via api/index.js)
module.exports = app;