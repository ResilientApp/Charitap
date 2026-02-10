const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const stripeLib = require('stripe');
console.log("Server starting...");

// Load .env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection (using MongoDB URI from .env)
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Geo-blocking middleware - US only
const geoBlock = require('./middleware/geoblock');
app.use(geoBlock);

// Stripe setup - USD only
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// Import routes - make sure the paths are correct
const authRoutes = require('./routes/authRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const roundUpRoutes = require('./routes/roundUpRoutes');
const charityRoutes = require('./routes/charityRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/roundup', roundUpRoutes);
app.use('/api/charities', charityRoutes);

// Start the cron processor for automated payments
require('./cronProcessor');

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});