const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stripe = require('stripe');

const RoundUp = require('./models/RoundUp');
const User = require('./models/User');
const Charity = require('./models/Charity');
const Transaction = require('./models/Transaction');

dotenv.config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function processUserRoundups(user) {
  const unpaidRoundUps = await RoundUp.find({ user: user.email, isPaid: false });
  let totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

  // Handle different payment preferences
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

  // Check if user has payment method
  if (!user.defaultPaymentMethod) {
    console.log(`No payment method for ${user.email} - skipping`);
    return;
  }

  try {
    // STEP 1: Charge the user's card
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

    // STEP 2: Transfer to charities
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

        await Transaction.create({
          stripeTransactionId: transfer.id,
          stripePaymentIntentId: paymentIntent.id,
          userEmail: user.email,
          amount: perCharityAmount,
          charity: charity._id,
        });

        console.log(`Transferred $${perCharityAmount.toFixed(2)} to ${charity.name}`);
      } catch (err) {
        console.error(`Error transferring to ${charity.name}:`, err.message);
      }
    }

    // STEP 3: Mark roundups as processed
    const now = new Date();
    await RoundUp.updateMany(
      { user: user.email, isPaid: false },
      {
        $set: {
          isPaid: true,
          stripePaymentIntentId: paymentIntent.id,
          chargedAt: now,
          processedAt: now
        }
      }
    );

    console.log(`Completed processing for ${user.email}`);

  } catch (error) {
    console.error(`Error charging ${user.email}:`, error.message);
    if (error.type === 'StripeCardError') {
      console.log(`Card declined for ${user.email}`);
    }
  }
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Running manual processor...');
  const users = await User.find();

  for (const user of users) {
    const today = new Date();
    if (user.paymentPreference === 'monthly' && today.getDate() !== 1) continue;

    await processUserRoundups(user);
  }

  mongoose.disconnect();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});
