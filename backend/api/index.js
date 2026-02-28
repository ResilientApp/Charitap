// Load environment variables FIRST
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const stripeLib = require("stripe");

const app = express();

// CORS - explicitly list trusted origins; avoid blanket ".vercel.app" wildcard
// which would allow any vercel deployment to send credentialed requests.
const allowedOrigins = [
  process.env.CORS_ORIGIN,           // Primary frontend Vercel URL (set via env)
  process.env.CORS_ORIGIN_EXTRA,     // Optional secondary origin
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server requests (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());

// MongoDB Connection - shared promise prevents concurrent connect races
let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;

  // Validate MONGODB_URI is configured before attempting to connect
  if (!process.env.MONGODB_URI) {
    console.error("FATAL: MONGODB_URI environment variable is not set");
    throw new Error("MONGODB_URI is required");
  }

  connectionPromise = mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      isConnected = true;
      connectionPromise = null;
      console.log("MongoDB connected");
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
};

// Connect before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Stripe setup - USD only
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("FATAL: STRIPE_SECRET_KEY environment variable is not set");
  // Don't throw immediately to allow other non-payment routes to work, but warn loudly
}
const stripe = process.env.STRIPE_SECRET_KEY ? stripeLib(process.env.STRIPE_SECRET_KEY) : null;

// Export stripe for internal use if needed
app.locals.stripe = stripe;

// Import routes
const authRoutes = require("../routes/authRoutes");
const stripeRoutes = require("../routes/stripeRoutes");
const roundUpRoutes = require("../routes/roundUpRoutes");
const charityRoutes = require("../routes/charityRoutes");
const charityNominationRoutes = require("../routes/charityNominationRoutes");
const adminRoutes = require("../routes/adminRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/roundup", roundUpRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/charity-nominations", charityNominationRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
module.exports = app;
