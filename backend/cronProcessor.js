const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const Stripe = require('stripe');
const crypto = require('crypto');

const RoundUp = require('./models/RoundUp');
const User = require('./models/User');
const Charity = require('./models/Charity');
const Transaction = require('./models/Transaction');
const resilientDB = require('./services/resilientdb-client');
const donationValidator = require('./services/donation-validator');

dotenv.config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

function hashIdentifier(email) {
  if (!email) return 'unknown';
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 12);
}

async function startCron() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for cron job');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

async function processUserRoundups(user) {
  const unpaidRoundUps = await RoundUp.find({ user: user.email, isPaid: false });
  const unpaidIds = unpaidRoundUps.map(r => r._id);
  let totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

  // Early return if no roundups
  if (unpaidRoundUps.length === 0) return;

  // Handle different payment preferences
  if (user.paymentPreference === 'threshold') {
    // If less than $5, skip for now (for "threshold" users)
    if (totalAmount < 5) return;
  } else if (user.paymentPreference === 'monthly' || user.paymentPreference === 'daily') {
    // Skip users with no roundups or tally of $0
    if (totalAmount === 0) {
      console.log(`Skipping ${hashIdentifier(user.email)}: zero total, no charge needed`);
      return;
    }
    // Only bump to $1 minimum if there ARE roundups but total is below $1
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

  // Check if user has payment method
  if (!user.defaultPaymentMethod) {
    console.log(`No payment method for ${hashIdentifier(user.email)} - skipping`);
    return;
  }

  // Validate stripeCustomerId before attempting a charge
  if (!user.stripeCustomerId) {
    console.log(`No stripeCustomerId for user ${hashIdentifier(user.email || user.id)} - skipping`);
    return;
  }

  // Open a MongoDB session so Transaction.create and RoundUp.updateMany
  // are atomic: if the DB write fails, no roundups are marked paid and
  // the caller can safely retry on the next cycle.
  const session = await mongoose.startSession();

  try {
    // STEP 1: Charge the user's card (outside session — Stripe is the point of no return)
    console.log(`Charging ${hashIdentifier(user.email)} for $${totalAmount.toFixed(2)}`);

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

    console.log(`Successfully charged ${hashIdentifier(user.email)}: $${totalAmount.toFixed(2)}`);

    // STEP 2: Transfer to charities — integer-cent math avoids rounding loss
    const totalCents = Math.round(totalAmount * 100);
    const baseShare = Math.floor(totalCents / charities.length);
    const remainder = totalCents % charities.length;

    let allTransfersSucceeded = true;
    const failedTransfers = [];
    const blockchainPromises = [];

    // All Transactions created inside a session for atomicity
    await session.withTransaction(async () => {
      for (let i = 0; i < charities.length; i++) {
        const charity = charities[i];
        // First N charities get +1 cent to distribute the remainder exactly
        const transferCents = baseShare + (i < remainder ? 1 : 0);

        try {
          const transfer = await stripe.transfers.create({
            amount: transferCents,
            currency: 'usd',
            destination: charity.stripeAccountId,
            transfer_group: `payment_${paymentIntent.id}`,
            description: 'Charitap donation',
          }, { idempotencyKey: `transfer-${paymentIntent.id}-${charity.stripeAccountId}` });

          const [transaction] = await Transaction.create([{
            stripeTransactionId: transfer.id,
            stripePaymentIntentId: paymentIntent.id,
            userId: user.id,
            amount: transferCents / 100,
            charity: charity._id,
          }], { session });

          console.log(`Transferred $${(transferCents / 100).toFixed(2)} to ${charity.name}`);

          // Blockchain: best-effort, non-critical — collected and awaited after session commits
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
                console.log(`[Charitap] OK Transaction recorded on blockchain: ${txId}`);
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
          failedTransfers.push({ charityName: charity.name, error: err.message });
          throw err; // abort the session transaction
        }
      }

      // STEP 3: Mark roundups as paid — inside the same session for atomicity
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
          },
          { session }
        );
      }
    });

    // Await blockchain writes after session commits (non-transactional, best-effort)
    await Promise.allSettled(blockchainPromises);

    if (allTransfersSucceeded) {
      console.log(`Completed processing for ${hashIdentifier(user.email)}`);
    } else {
      console.error(`Some transfers failed for ${hashIdentifier(user.email)}. Failed:`, failedTransfers);
      // Roundups not marked paid - will be retried next cycle
    }

  } catch (error) {
    console.error(`Error charging ${hashIdentifier(user.email)}:`, error.message);
    if (error.type === 'StripeCardError') {
      console.log(`Card declined for ${hashIdentifier(user.email)} - will retry next cycle`);
    }
  } finally {
    await session.endSession();
  }
}

  // Run the cron job every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily roundup processor...');

    try {
      const cursor = User.find().cursor();

      for await (const user of cursor) {
        // Check if user should be processed today
        const today = new Date();
        const shouldProcess =
          user.paymentPreference === 'threshold' || // Threshold users: process daily
          user.paymentPreference === 'daily' ||     // Daily users: process daily
          (user.paymentPreference === 'monthly' && today.getDate() === 1); // Monthly users: process only on 1st

        if (!shouldProcess) continue;

        await processUserRoundups(user);
      }
    } catch (err) {
      console.error('Error in cron job:', err.message);
    }
  });
}

startCron();
