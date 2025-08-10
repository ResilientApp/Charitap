/* eslint-disable no-console */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '***REMOVED***';
const stripe = require('stripe')(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const app = express();
app.use(cors({ origin: ['http://localhost:3000'], credentials: false }));
app.use(bodyParser.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Ensure a customer exists for the given email; returns customer id
async function getOrCreateCustomerByEmail(email, name) {
  if (!email) throw new Error('Email is required');
  // Try to find existing customer
  const matched = await stripe.customers.search({ query: `email:'${email}'` });
  if (matched.data && matched.data.length > 0) {
    return matched.data[0].id;
  }
  const created = await stripe.customers.create({ email, name });
  return created.id;
}

// Create a SetupIntent for saving a card
app.post('/api/create-setup-intent', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    const customerId = await getOrCreateCustomerByEmail(email, name);
    const setupIntent = await stripe.setupIntents.create({ customer: customerId, usage: 'off_session' });
    res.json({ clientSecret: setupIntent.client_secret, customerId });
  } catch (err) {
    console.error('Failed to create setup intent', err);
    res.status(400).json({ error: err.message });
  }
});

// List payment methods
app.post('/api/list-payment-methods', async (req, res) => {
  try {
    const { email } = req.body || {};
    const customerId = await getOrCreateCustomerByEmail(email);
    const pms = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    res.json({ paymentMethods: pms.data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Stripe server listening on http://localhost:${port}`));


