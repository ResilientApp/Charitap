const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const Stripe = require('stripe');

const RoundUp = require('./models/RoundUp');
const User = require('./models/User');
const Charity = require('./models/Charity');
const Transaction = require('./models/Transaction');

dotenv.config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for cron job'))
.catch(err => console.error('MongoDB connection error:', err));

async function processUserRoundups(user) {
  const unpaidRoundUps = await RoundUp.find({ user: user.email, isPaid: false });
  const totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

  // Handle different payment preferences
  if (user.paymentPreference === 'threshold') {
    // If less than $5, skip for now (for "threshold" users)
    if (totalAmount < 5) return;
  } else if (user.paymentPreference === 'monthly') {
    // For monthly users, ensure minimum of $1
    if (totalAmount < 1) {
      // Round up to $1 if less than $1
      const roundUpToDollar = 1 - totalAmount;
      // Create a virtual roundup entry to make up the difference
      totalAmount = 1;
      console.log(`Rounding up ${user.email} to $1 (added $${roundUpToDollar.toFixed(2)})`);
    }
  }

  const charities = await Charity.find({ _id: { $in: user.selectedCharities } });
  if (!charities.length) return;

  const perCharityAmount = totalAmount / charities.length;

  for (const charity of charities) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(perCharityAmount * 100), // converting to cents for Stripe integration
        currency: 'usd',
        destination: charity.stripeAccountId,
        transfer_group: `user_${user.email}`,
      });

      await Transaction.create({
        stripeTransactionId: transfer.id,
        userEmail: user.email,
        amount: perCharityAmount,
        charity: charity._id,
      });

      console.log(`Transferred $${perCharityAmount.toFixed(2)} to ${charity.name} for ${user.email}`);
    } catch (err) {
      console.error(`Error transferring to ${charity.name}:`, err.message);
    }
  }

  // Mark all processed roundups as paid
  await RoundUp.updateMany({ user: user.email, isPaid: false }, { $set: { isPaid: true } });
}

// Run the cron job every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily roundup processor...');

  try {
    const users = await User.find();

    for (const user of users) {
      if (user.paymentPreference === 'monthly') {
        const today = new Date();
        if (today.getDate() !== 1) continue; // Run monthly jobs only on 1st
      }

      await processUserRoundups(user);
    }
  } catch (err) {
    console.error('Error in cron job:', err.message);
  }
});
