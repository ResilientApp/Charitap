// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripeLib = require('stripe');

// Load .env variables
dotenv.config();

// Debug log for checking if the Stripe key is loaded
console.log("✅ Loaded Stripe Key:", process.env.STRIPE_SECRET_KEY ? '✔️ Present' : '❌ MISSING');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Stripe setup
const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// Create Stripe account link
app.post('/api/create-stripe-link', async (req, res) => {
  try {
    const { accountId } = req.body;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'http://localhost:3000/reauth',
      return_url: 'http://localhost:3000/success',
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Create a connected account
app.post('/api/create-account', async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
    });

    res.json({ accountId: account.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
