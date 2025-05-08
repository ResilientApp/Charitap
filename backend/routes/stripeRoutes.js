// routes/stripeRoutes.js
const express = require('express');
const router = express.Router();
const stripeLib = require('stripe');
require('dotenv').config();

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// API to create a connected account
router.post('/create-account', async (req, res) => {
  try {
    const account = await stripe.accounts.create({ type: 'express' });
    res.json({ accountId: account.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// API to create Stripe account link
router.post('/create-stripe-link', async (req, res) => {
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

module.exports = router;