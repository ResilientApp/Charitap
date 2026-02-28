// Vercel Cron Job handler for daily roundup processing
// Triggered by Vercel at 0 0 * * * (midnight UTC daily)
// This replaces the node-cron scheduler in cronProcessor.js

const dotenv = require('dotenv');
dotenv.config();

const crypto = require('crypto');
const mongoose = require('mongoose');
const Stripe = require('stripe');

const RoundUp = require('../../models/RoundUp');
const User = require('../../models/User');
const Charity = require('../../models/Charity');
const Transaction = require('../../models/Transaction');
const resilientDB = require('../../services/resilientdb-client');
const donationValidator = require('../../services/donation-validator');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('FATAL: STRIPE_SECRET_KEY is required');
  process.exit(1);
}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Non-PII identifier for logging - hashes email with SHA-256
function hashIdentifier(email) {
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 12);
}

// MongoDB connection - shared promise to prevent race where multiple requests start new connects
let isConnected = false;
let connectionPromise = null;
const connectDB = async () => {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;
  if (!process.env.MONGODB_URI) {
    console.error('FATAL: MONGODB_URI environment variable is not set');
    throw new Error('MONGODB_URI is required');
  }
  connectionPromise = mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      isConnected = true;
      connectionPromise = null;
      console.log('MongoDB connected');
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });
  return connectionPromise;
};

async function processUserRoundups(user) {
  const unpaidRoundUps = await RoundUp.find({ 
    user: user.email, 
    isPaid: false,
    stripePaymentIntentId: { $ne: 'processing' } 
  });
  const unpaidIds = unpaidRoundUps.map(r => r._id);
  let totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

  // Early return if no roundups
  if (unpaidRoundUps.length === 0) return;

  if (user.paymentPreference === 'threshold') {
    if (totalAmount < 5) return;
  } else if (user.paymentPreference === 'monthly') {
    // Only bump amounts that are positive but below $1 - do NOT charge when totalAmount is 0
    if (totalAmount === 0) {
      console.log(`Skipping ${hashIdentifier(user.email)}: no roundups to charge`);
      return;
    }
    if (totalAmount > 0 && totalAmount < 1) {
      console.log(`Rounding up ${hashIdentifier(user.email)} to $1 minimum (was $${totalAmount.toFixed(2)})`);
      totalAmount = 1;
    }
  }

  const charities = await Charity.find({ _id: { $in: user.selectedCharities } });
  if (!charities.length) {
    console.log(`No charities selected for ${hashIdentifier(user.email)}`);
    return;
  }

  if (!user.defaultPaymentMethod) {
    console.log(`No payment method for ${hashIdentifier(user.email)} - skipping`);
    return;
  }

  // Validate stripeCustomerId before attempting a charge
  if (!user.stripeCustomerId) {
    console.log(`No stripeCustomerId for user ${hashIdentifier(user.email)} - skipping`);
    return;
  }

  // Read/Claim transaction isolation
  const claimResult = await RoundUp.updateMany(
    { _id: { $in: unpaidIds }, isPaid: false, stripePaymentIntentId: { $ne: 'processing' } },
    { $set: { stripePaymentIntentId: 'processing' } }
  );

  if (claimResult.modifiedCount !== unpaidIds.length) {
    console.log(`Concurrent processing detected for user ${hashIdentifier(user.email)}. Skipping.`);
    await RoundUp.updateMany({ _id: { $in: unpaidIds }, stripePaymentIntentId: 'processing' }, { $unset: { stripePaymentIntentId: 1 } });
    return;
  }

  let allTransfersSucceeded = false;

  try {
    console.log(`Charging user ${hashIdentifier(user.email)} for $${totalAmount.toFixed(2)}`);

    // Deterministic idempotency key: hash of unpaidIds to fit within Stripe's 255-char limit
    const unpaidDigest = crypto.createHash('sha256').update(unpaidIds.map(id => id.toString()).sort().join('-')).digest('hex');
    const idempotencyKey = `charge-${user.id}-${unpaidDigest}`.substring(0, 255);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: user.defaultPaymentMethod,
      off_session: true,
      confirm: true,
      description: `Charitap donation - ${unpaidRoundUps.length} roundups`,
      metadata: {
        userId: user.id,
        roundupCount: unpaidRoundUps.length.toString(),
        totalAmount: totalAmount.toString(),
      },
    }, { idempotencyKey });

    console.log(`Successfully charged user ${hashIdentifier(user.email)}: $${totalAmount.toFixed(2)}`);

    // Integer-cent division: avoids floating-point rounding loss
    const totalCents = Math.round(totalAmount * 100);
    const baseShare = Math.floor(totalCents / charities.length);
    const remainder = totalCents % charities.length;

    // Track successes and failures separately
    allTransfersSucceeded = true;
    const failedTransfers = [];
    const blockchainPromises = [];

    for (let i = 0; i < charities.length; i++) {
      const charity = charities[i];
      // First N charities get +1 cent to distribute the remainder
      const transferCents = baseShare + (i < remainder ? 1 : 0);

      try {
        const transfer = await stripe.transfers.create({
          amount: transferCents,
          currency: 'usd',
          destination: charity.stripeAccountId,
          transfer_group: `payment_${paymentIntent.id}`,
          description: `Charitap donation`,
        });

        const transaction = await Transaction.create({
          stripeTransactionId: transfer.id,
          stripePaymentIntentId: paymentIntent.id,
          userId: user.id, // Replaced userEmail with non-PII identifier
          amount: transferCents / 100,
          charity: charity._id,
        });

        console.log(`Transferred $${(transferCents / 100).toFixed(2)} to ${charity.name}`);

        // Record to blockchain - collect promise to await before function returns
        const blockchainPromise = (async () => {
          try {
            const donationData = { amount: transferCents / 100, charities: [charity._id.toString()] };
            const validationResult = donationValidator.validateDonation(donationData);
            const ledgerKey = resilientDB.generateKey('transaction', transaction._id.toString());
            const ledgerData = {
              transactionId: transaction._id.toString(),
              stripeTransferId: transfer.id,
              stripePaymentIntentId: paymentIntent.id,
              userId: resilientDB.hashSensitiveData(user.id || user.email),
              amount: (transferCents / 100).toFixed(2),
              charityId: charity._id.toString(),
              charityName: charity.name,
              timestamp: new Date().toISOString(),
              status: 'completed',
              validated: validationResult.valid,
              validationRules: validationResult.appliedRules,
              blockchainVersion: '2.0',
            };
            const txId = await resilientDB.set(ledgerKey, ledgerData);
            if (txId) {
              transaction.blockchainTxKey = ledgerKey;
              transaction.blockchainTxId = txId;
              transaction.blockchainVerified = true;
              transaction.blockchainTimestamp = new Date();
              await transaction.save();
              console.log(`[Charitap] OK Blockchain tx: ${txId}`);
            }
          } catch (blockchainError) {
            console.error('[Charitap] WARNING Blockchain write failed (non-critical):', blockchainError.message);
            transaction.blockchainError = blockchainError.message;
            await transaction.save();
          }
        })();
        blockchainPromises.push(blockchainPromise);

      } catch (err) {
        console.error(`Error transferring to ${charity.name}:`, err.message);
        allTransfersSucceeded = false;
        failedTransfers.push({ charityId: charity._id, charityName: charity.name, error: err.message });
      }
    }

    // Await all blockchain writes before the serverless function exits
    await Promise.all(blockchainPromises);

    // Only mark roundups as paid when ALL transfers succeeded, using exact IDs fetched earlier
    if (allTransfersSucceeded) {
      const now = new Date();
      await RoundUp.updateMany(
        { _id: { $in: unpaidIds }, user: user.email },
        {
          $set: {
            isPaid: true,
            stripePaymentIntentId: paymentIntent.id,
            chargedAt: now,
            processedAt: now,
          },
        }
      );
      console.log(`Completed processing for user ${hashIdentifier(user.email)}`);
    } else {
      console.error(`Some transfers failed for user ${hashIdentifier(user.email)}:`, failedTransfers);
      // Do not mark roundups as paid - will retry next cycle
    }

  } catch (error) {
    console.error(`Error charging user ${hashIdentifier(user.email)}:`, error.message);
    if (error.type === 'StripeCardError') {
      console.log(`Card declined for user ${hashIdentifier(user.email)} - will retry next cycle`);
    }
  } finally {
    if (!allTransfersSucceeded) {
      // Rollback claim
      await RoundUp.updateMany({ _id: { $in: unpaidIds }, stripePaymentIntentId: 'processing' }, { $unset: { stripePaymentIntentId: 1 } });
    }
  }
}

// Vercel serverless handler
module.exports = async function handler(req, res) {
  // Security: Verify this is triggered by Vercel Cron (not a random public request)
  // Guard: ensure CRON_SECRET is configured to avoid matching "Bearer undefined"
  if (!process.env.CRON_SECRET) {
    console.error('Server misconfiguration: CRON_SECRET is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const authHeader = req.headers['authorization'] || '';
  const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;

  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expectedHeader);

  if (authBuffer.length !== expectedBuffer.length) {
    // Prevent timing leaks by still calling timingSafeEqual on dummy buffers
    crypto.timingSafeEqual(expectedBuffer, expectedBuffer);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!crypto.timingSafeEqual(authBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Running daily roundup processor (Vercel Cron)...');

  try {
    await connectDB();
    const users = await User.find();
    const today = new Date();
    let processed = 0;

    for (const user of users) {
      const shouldProcess =
        user.paymentPreference === 'threshold' ||
        (user.paymentPreference === 'monthly' && today.getDate() === 1);

      if (!shouldProcess) continue;

      await processUserRoundups(user);
      processed++;
    }

    res.json({ success: true, message: `Processed ${processed} users`, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Error in cron job:', err.message);
    res.status(500).json({ error: err.message });
  }
};
