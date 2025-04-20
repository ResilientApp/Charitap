const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const stripeLib = require('stripe');
console.log("Server starting...");

// Load .env variables
dotenv.config();

const app = express();
const PORT = 3001;

// MongoDB Connection (using MongoDB URI from .env)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Stripe setup
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// Import routes - make sure the paths are correct
const stripeRoutes = require('./routes/stripeRoutes');
const roundUpRoutes = require('./routes/roundUpRoutes');

// Use routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/roundup', roundUpRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});