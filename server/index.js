/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;
try {
  if (STRIPE_SECRET_KEY) {
    stripe = require('stripe')(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
} catch (e) {
  console.error('Stripe SDK init failed:', e.message);
}

const app = express();
app.use(cors({ origin: ['http://localhost:3000'], credentials: false }));
app.use(bodyParser.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Require basic authorization (standalone server)
const requireAuth = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Unauthorized' });
  const token = req.headers.authorization.split(' ')[1] || req.headers.authorization;
  try {
    if (process.env.API_KEY && token === process.env.API_KEY) {
      req.user = { id: 'admin', email: 'admin@charitap.com' };
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Ensure a customer exists for the given email; returns customer id
async function getOrCreateCustomerByEmail(email, name) {
  if (!email) throw new Error('Email is required');
  // Try to find existing customer
  if (!stripe) throw new Error('Stripe disabled');
  
  // Validate email format and escape to prevent Stripe query injection
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error('Invalid email format');
  const safeEmail = String(email).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  
  const matched = await stripe.customers.search({ query: `email:'${safeEmail}'` });
  if (matched.data && matched.data.length > 0) {
    return matched.data[0].id;
  }
  const created = await stripe.customers.create({ email, name });
  return created.id;
}

// Create a SetupIntent for saving a card
app.post('/api/create-setup-intent', async (req, res) => {
  try {
    if (!stripe) throw new Error('Stripe secret missing. Set STRIPE_SECRET_KEY in server/.env');
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
app.post('/api/list-payment-methods', requireAuth, async (req, res) => {
  try {
    if (!stripe) throw new Error('Stripe secret missing. Set STRIPE_SECRET_KEY in server/.env');
    const { email } = req.body || {};
    const customerId = await getOrCreateCustomerByEmail(email);
    const pms = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    res.json({ paymentMethods: pms.data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Set default payment method for customer
app.post('/api/set-default-payment-method', requireAuth, async (req, res) => {
  try {
    if (!stripe) throw new Error('Stripe secret missing. Set STRIPE_SECRET_KEY in server/.env');
    const { email, paymentMethodId } = req.body || {};
    
    // Verify ownership
    const targetEmail = email || req.user.email;
    if (req.user && req.user.email && req.user.email !== targetEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const customerId = await getOrCreateCustomerByEmail(targetEmail);
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!pm || pm.customer !== customerId) {
      return res.status(403).json({ error: 'Forbidden: payment method does not belong to this user' });
    }
    
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Detach a payment method
app.post('/api/detach-payment-method', requireAuth, async (req, res) => {
  try {
    if (!stripe) throw new Error('Stripe secret missing. Set STRIPE_SECRET_KEY in server/.env');
    const { email, paymentMethodId } = req.body || {};
    
    // Verify ownership
    const targetEmail = email || req.user.email;
    if (req.user && req.user.email && req.user.email !== targetEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const customerId = await getOrCreateCustomerByEmail(targetEmail);
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!pm || pm.customer !== customerId) {
      return res.status(403).json({ error: 'Forbidden: payment method does not belong to this user' });
    }
    
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ ok: true, paymentMethodId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PaymentIntent (for wallets)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) throw new Error('Stripe disabled');
    const { email, planId } = req.body || {};
    
    // Stop accepting arbitrary amount, derive on server
    let amount = 100; // minimum / default wallet attach
    if (planId === 'premium') amount = 500;
    
    const customerId = await getOrCreateCustomerByEmail(email);
    const pi = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      description: 'Charitap wallet attach',
      setup_future_usage: 'off_session',
    });
    res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Subscriptions (optional)
app.post('/api/create-subscription', async (req, res) => {
  try {
    if (!stripe) throw new Error('Stripe disabled');
    const { email, priceId } = req.body || {};
    if (!priceId) throw new Error('Missing priceId');
    const customerId = await getOrCreateCustomerByEmail(email);
    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    res.json({ id: sub.id, status: sub.status, latestInvoice: sub.latest_invoice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Minimal OTP email flow for password reset / verify
const RATE_LIMIT_WINDOW_MS = 60000;
const otpStore = new Map(); // email -> { hash, exp }
const rateLimitStore = new Map(); // email -> timestamp
const failedAttemptsStore = new Map(); // email -> { count, lockUntil }

let cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [email, rec] of otpStore.entries()) {
    if (now > rec.exp) otpStore.delete(email);
  }
  for (const [email, timestamp] of rateLimitStore.entries()) {
    if (now > timestamp + RATE_LIMIT_WINDOW_MS) rateLimitStore.delete(email);
  }
  for (const [email, rec] of failedAttemptsStore.entries()) {
    if (rec.lockUntil && now > rec.lockUntil) failedAttemptsStore.delete(email);
  }
}, 60 * 60 * 1000); // 1 hour cleanup

function sha256(val) { return crypto.createHash('sha256').update(String(val)).digest('hex'); }
const transporter = nodemailer.createTransport(process.env.SMTP_URL ? process.env.SMTP_URL : {
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

app.post('/api/password/request-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) throw new Error('Email required');

    // OTP Rate limiting
    const lastReq = rateLimitStore.get(email);
    if (lastReq && Date.now() - lastReq < RATE_LIMIT_WINDOW_MS) {
      throw new Error('Please wait 60 seconds before requesting another code');
    }
    rateLimitStore.set(email, Date.now());
    const code = crypto.randomInt(100000, 1000000).toString();
    otpStore.set(email, { hash: sha256(code), exp: Date.now() + 10 * 60 * 1000 });
    const html = `
      <div style="font-family:Arial,sans-serif;">
        <h2>Charitap verification code</h2>
        <p>Your one-time code is:</p>
        <div style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `;
    await transporter.sendMail({ from: process.env.GMAIL_USER, to: email, subject: 'Your Charitap verification code', html });
    res.json({ ok: true });
  } catch (err) {
    console.error('OTP send failed', err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    
    // Check account lockout
    const attemptRec = failedAttemptsStore.get(email) || { count: 0, lockUntil: 0 };
    if (attemptRec.lockUntil && Date.now() < attemptRec.lockUntil) {
      const err = new Error('Too many failed attempts. Try again later.');
      err.isRateLimit = true;
      throw err;
    }

    const rec = otpStore.get(email);
    if (!rec || Date.now() > rec.exp) throw new Error('Code expired');
    
    // Timing-safe comparison to prevent side-channel timing attacks
    const providedHash = Buffer.from(sha256(otp));
    const storedHash = Buffer.from(rec.hash);
    if (providedHash.length !== storedHash.length || !crypto.timingSafeEqual(providedHash, storedHash)) {
      // Increment failed attempts
      attemptRec.count += 1;
      if (attemptRec.count >= 5) {
        attemptRec.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
        attemptRec.count = 0; // Reset count for after lockout
      }
      failedAttemptsStore.set(email, attemptRec);
      throw new Error('Invalid code');
    }

    otpStore.delete(email);
    failedAttemptsStore.delete(email); // Clear lockout progress on success
    res.json({ ok: true });
  } catch (err) {
    if (err.isRateLimit) {
      return res.status(429).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Local server listening on http://localhost:${port}`));


