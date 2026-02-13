// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

console.log("Server starting...");

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripeLib = require('stripe');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection (using MongoDB URI from .env)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

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

// Start the cron processor for automated payments
require('./cronProcessor');

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});