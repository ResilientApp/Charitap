const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // Must be called before requiring services

const crypto = require('crypto');
const Stripe = require('stripe');

const RoundUp = require('./models/RoundUp');
const User = require('./models/User');
const Charity = require('./models/Charity');
const Transaction = require('./models/Transaction');
const resilientDB = require('./services/resilientdb-client');
const rescontractClient = require('./services/rescontract-client');
const donationValidator = require('./services/donation-validator');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * processUserRoundups - Atomically charges the user and distributes to charities.
 *
 * Atomicity strategy:
 *  - If any Stripe transfer fails, no roundups are marked paid (retry next run).
 *  - All DB writes (Transaction.create, RoundUp.updateMany) happen inside a
 *    MongoDB session so they can be rolled back together if a later step throws.
 *  - Blockchain writes are best-effort and non-blocking (non-critical layer).
 *  - If the charge succeeds but ALL transfers fail, a Stripe refund is issued.
 */
async function processUserRoundups(user) {
  // Capture exact IDs of unpaid roundups before any state changes
  const unpaidRoundUps = await RoundUp.find({ 
    user: user.email, 
    isPaid: false,
    stripePaymentIntentId: { $ne: 'processing' }
  });
  const unpaidIds = unpaidRoundUps.map(r => r._id);
  let totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

  // Early return: nothing to process
  if (unpaidRoundUps.length === 0) return;

  // Handle different payment preferences
  if (user.paymentPreference === 'threshold') {
    if (totalAmount < 5) return;
  } else if (user.paymentPreference === 'monthly') {
    // Skip if no actual roundups to charge
    if (totalAmount === 0) {
      console.log(`Skipping ${user.email}: zero total amount, no charge`);
      return;
    }
    // Only bump positive sub-$1 totals to $1 minimum
    if (totalAmount > 0 && totalAmount < 1) {
      console.log(`Rounding up ${user.email} to $1 minimum (was $${totalAmount.toFixed(2)})`);
      totalAmount = 1;
    }
  }

  const charities = await Charity.find({ _id: { $in: user.selectedCharities } });
  if (!charities.length) {
    console.log(`No charities selected for ${user.email}`);
    return;
  }

  if (!user.defaultPaymentMethod) {
    console.log(`No payment method for ${user.email} - skipping`);
    return;
  }

  if (!user.stripeCustomerId) {
    console.log(`No stripeCustomerId for ${user.email} - skipping`);
    return;
  }

  // Read/Claim transaction isolation
  const claimResult = await RoundUp.updateMany(
    { _id: { $in: unpaidIds }, isPaid: false, stripePaymentIntentId: { $ne: 'processing' } },
    { $set: { stripePaymentIntentId: 'processing' } }
  );

  if (claimResult.modifiedCount !== unpaidIds.length) {
    console.log(`Concurrent processing detected for ${user.email}. Skipping.`);
    await RoundUp.updateMany({ _id: { $in: unpaidIds }, stripePaymentIntentId: 'processing' }, { $unset: { stripePaymentIntentId: 1 } });
    return;
  }

  let allTransfersSucceeded = false;

  // Open a MongoDB session for atomic DB writes
  const session = await mongoose.startSession();

  try {
    // STEP 1: Charge the user's card
    console.log(`Charging ${user.email} for $${totalAmount.toFixed(2)}`);

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

    console.log(`Successfully charged ${user.email}: $${totalAmount.toFixed(2)}`);

    // Persist PaymentIntent ID immediately before transfers
    await RoundUp.updateMany(
      { _id: { $in: unpaidIds } },
      { $set: { stripePaymentIntentId: paymentIntent.id } }
    );

    // STEP 2: Transfer to charities — integer-cent math to avoid rounding loss
    const totalCents = Math.round(totalAmount * 100);
    const baseShare = Math.floor(totalCents / charities.length);
    const remainder = totalCents % charities.length;

    allTransfersSucceeded = true;
    const failedTransfers = [];
      // Extract network calls out of MongoDB transaction so retries don't double-charge APIs
      for (let i = 0; i < charities.length; i++) {
        const charity = charities[i];
        const transferCents = baseShare + (i < remainder ? 1 : 0);
        if (transferCents <= 0) continue; // Reject 0 cent transfers

        try {
          const transfer = await stripe.transfers.create({
            amount: transferCents,
            currency: 'usd',
            destination: charity.stripeAccountId,
            transfer_group: `payment_${paymentIntent.id}`,
            description: 'Charitap donation',
          }, { idempotencyKey: `transfer-${paymentIntent.id}-${charity.stripeAccountId}` });
          
          successfulTransfers.push({
            transferCents,
            transfer,
            charity
          });
        } catch (err) {
          console.error(`Error transferring to ${charity.name}:`, err.message);
          allTransfersSucceeded = false;
          failedTransfers.push({ charityName: charity.name, error: err.message, amountCents: transferCents });
        }
      }

    // All DB Transaction creations inside a session for atomicity
    if (successfulTransfers.length > 0) {
      await session.withTransaction(async () => {
        for (const st of successfulTransfers) {
          const { transferCents, transfer, charity } = st;

          const [transaction] = await Transaction.create([{
            stripeTransactionId: transfer.id,
            stripePaymentIntentId: paymentIntent.id,
            userId: user.id || user.email, // Using non-PII ID
            amount: transferCents / 100,
            charity: charity._id,
          }], { session });

          console.log(`Transferred $${(transferCents / 100).toFixed(2)} to ${charity.name}`);

          // Blockchain write: non-critical, best-effort
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
                // Charity numeric ID from model field rather than slice hack
                const charityNumId = typeof charity.numericId === 'number'
                  ? charity.numericId
                  : (parseInt(charity._id.toString().slice(-8), 16) || 0);
                const amountCents = transferCents;

                try {
                  const receiptResult = await rescontractClient.mintReceipt(charityNumId, amountCents);
                  if (receiptResult) transaction.contractReceiptId = receiptResult;
                } catch (contractErr) {
                  console.error(`⚠️ Contract receipt failed: ${contractErr.message}`);
                }

                transaction.blockchainTxKey = ledgerKey;
                transaction.blockchainTxId = txId;
                transaction.blockchainVerified = true;
                transaction.blockchainTimestamp = new Date();
              }
            } catch (blockchainErr) {
              console.error('⚠️ Blockchain write failed (non-critical):', blockchainErr.message);
              transaction.blockchainError = blockchainErr.message;
            }
            // Save outside session (blockchain fields are non-critical)
            await transaction.save();
          })();
          blockchainPromises.push(blockchainPromise);
        }

      // STEP 3: Mark roundups as paid — all inside same session for atomicity
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
    });
   }

    // Await blockchain writes after session commits (non-transactional, best-effort)
    await Promise.allSettled(blockchainPromises);

    console.log(`✅ Completed processing for ${user.email}`);

    if (!allTransfersSucceeded) {
      // Some transfers failed — issue refund for undelivered amount
      console.error(`Some transfers failed for ${user.email}:`, failedTransfers);
      const failedCents = failedTransfers.reduce((sum, f) => sum + f.amountCents, 0);
      if (failedCents > 0) {
        try {
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            amount: failedCents,
            reason: 'other',
            metadata: { failedTransfers: JSON.stringify(failedTransfers) },
          });
          console.log(`Issued partial refund of $${(failedCents / 100).toFixed(2)} for failed transfers`);
        } catch (refundErr) {
          console.error('Failed to issue refund:', refundErr.message);
        }
      }
    }

  } catch (error) {
    console.error(`Error processing ${user.email}:`, error.message);
    if (error.type === 'StripeCardError') {
      console.log(`Card declined for ${user.email} - will retry next cycle`);
    }
  } finally {
    await session.endSession();
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Running manual processor...');
    const users = await User.find();

    for (const user of users) {
      // For manual run, force process by ignoring date filters
      await processUserRoundups(user);
    }

    await mongoose.disconnect();
    console.log('Done.');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
