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
  const totalAmount = unpaidRoundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);

  if (user.paymentPreference === 'threshold' && totalAmount < 5) return;

  const charities = await Charity.find({ _id: { $in: user.selectedCharities } });
  if (!charities.length) return;

  const perCharityAmount = totalAmount / charities.length;

  for (const charity of charities) {
    const transfer = await stripe.transfers.create({
      amount: Math.round(perCharityAmount * 100),
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
  }

  await RoundUp.updateMany({ user: user.email, isPaid: false }, { $set: { isPaid: true } });
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
