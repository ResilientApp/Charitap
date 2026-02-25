// Vercel Cron Job handler for daily roundup processing
// Triggered by Vercel at 0 0 * * * (midnight UTC daily)
// This replaces the node-cron scheduler in cronProcessor.js

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Stripe = require('stripe');

const RoundUp = require('../../models/RoundUp');
const User = require('../../models/User');
const Charity = require('../../models/Charity');
const Transaction = require('../../models/Transaction');
const resilientDB = require('../../services/resilientdb-client');
const donationValidator = require('../../services/donation-validator');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// MongoDB connection (serverless-friendly)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
};

async function processUserRoundups(user) {
  const unpaidRoundUps = await RoundUp.find({ user: user.email, isPaid: false });
  let totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

  if (user.paymentPreference === 'threshold') {
    if (totalAmount < 5) return;
  } else if (user.paymentPreference === 'monthly') {
    if (totalAmount < 1) {
      totalAmount = 1;
      console.log(`Rounding up ${user.email} to $1 minimum`);
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

  try {
    console.log(`Charging ${user.email} for $${totalAmount.toFixed(2)}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method: user.defaultPaymentMethod,
      off_session: true,
      confirm: true,
      description: `Charitap donation - ${unpaidRoundUps.length} roundups`,
      metadata: {
        userEmail: user.email,
        roundupCount: unpaidRoundUps.length.toString(),
        totalAmount: totalAmount.toString(),
      },
    });

    console.log(`Successfully charged ${user.email}: $${totalAmount.toFixed(2)}`);

    const perCharityAmount = totalAmount / charities.length;

    for (const charity of charities) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(perCharityAmount * 100),
          currency: 'usd',
          destination: charity.stripeAccountId,
          transfer_group: `payment_${paymentIntent.id}`,
          description: `Donation from ${user.email}`,
        });

        const transaction = await Transaction.create({
          stripeTransactionId: transfer.id,
          stripePaymentIntentId: paymentIntent.id,
          userEmail: user.email,
          amount: perCharityAmount,
          charity: charity._id,
        });

        console.log(`Transferred $${perCharityAmount.toFixed(2)} to ${charity.name}`);

        // Record to blockchain (non-blocking, fail-silent)
        (async () => {
          try {
            const donationData = { amount: perCharityAmount, charities: [charity._id.toString()] };
            const validationResult = donationValidator.validateDonation(donationData);
            const ledgerKey = resilientDB.generateKey('transaction', transaction._id.toString());
            const ledgerData = {
              transactionId: transaction._id.toString(),
              stripeTransferId: transfer.id,
              stripePaymentIntentId: paymentIntent.id,
              userId: resilientDB.hashSensitiveData(user.email),
              amount: perCharityAmount.toFixed(2),
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

      } catch (err) {
        console.error(`Error transferring to ${charity.name}:`, err.message);
      }
    }

    const now = new Date();
    await RoundUp.updateMany(
      { user: user.email, isPaid: false },
      {
        $set: {
          isPaid: true,
          stripePaymentIntentId: paymentIntent.id,
          chargedAt: now,
          processedAt: now,
        },
      }
    );

    console.log(`Completed processing for ${user.email}`);

  } catch (error) {
    console.error(`Error charging ${user.email}:`, error.message);
    if (error.type === 'StripeCardError') {
      console.log(`Card declined for ${user.email} - will retry next cycle`);
    }
  }
}

// Vercel serverless handler
module.exports = async function handler(req, res) {
  // Security: Verify this is triggered by Vercel Cron (not a random public request)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
