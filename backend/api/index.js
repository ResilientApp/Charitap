// Load environment variables FIRST
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const stripeLib = require("stripe");

const app = express();

// CORS - Allow both the frontend Vercel URL and any custom domain
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());

// MongoDB Connection (lazy - only connect once)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log("MongoDB connected");
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
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

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
