// routes/stripeRoutes.js
const express = require('express');
const router = express.Router();
const stripeLib = require('stripe');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

// API to create a connected account (protected - for charities)
router.post('/create-account', authenticateToken, async (req, res) => {
  try {
    const account = await stripe.accounts.create({ type: 'express' });
    
    // Store the Stripe account ID with the user (if this user represents a charity)
    req.user.stripeAccountId = account.id;
    await req.user.save();
    
    res.json({ accountId: account.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// API to create Stripe account link (protected)
router.post('/create-stripe-link', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reauth`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// API to create a payment setup for user
router.post('/create-customer', authenticateToken, async (req, res) => {
  try {
    // Check if user already has a Stripe customer ID
    if (req.user.stripeCustomerId) {
      return res.json({ customerId: req.user.stripeCustomerId });
    }

    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.displayName,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    // Save the customer ID to user record
    req.user.stripeCustomerId = customer.id;
    await req.user.save();

    res.json({ customerId: customer.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

module.exports = router;