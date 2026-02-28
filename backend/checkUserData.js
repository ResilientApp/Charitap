require('dotenv').config(); // Load env FIRST

const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const RoundUp = require('./models/RoundUp');

(async () => {
  // Read email from CLI argument to avoid hardcoding PII
  const email = process.argv[2];
  if (!email || !email.includes('@')) {
    console.error('Usage: node checkUserData.js <email>');
    console.error('Example: node checkUserData.js user@example.com');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const User = require('./models/User');
    const user = await User.findOne({ email });
    const transactions = user ? await Transaction.find({ userId: user._id }) : [];
    const roundups = await RoundUp.find({ user: email });

    console.log(`Transactions for ${email}:`, transactions.length);
    console.log(`RoundUps for ${email}:`, roundups.length);

    if (transactions.length > 0) {
      const total = transactions.reduce((sum, t) => sum + t.amount, 0);
      console.log('Total donated: $' + total.toFixed(2));

      const onBlockchain = transactions.filter(t => t.blockchainTxKey || t.blockchainTxId).length;
      console.log('On blockchain:', onBlockchain + '/' + transactions.length);

      console.log('\nTransaction details:');
      transactions.forEach(t => {
        const date = t.timestamp ? t.timestamp.toISOString().substring(0, 10) : 'unknown';
        const blockchain = (t.blockchainTxKey || t.blockchainTxId) ? 'YES ✅' : 'NO ❌';
        console.log('  - $' + t.amount.toFixed(2), 'at', date, 'blockchain:', blockchain);
      });
    }

    if (roundups.length > 0) {
      const pending = roundups.filter(r => !r.isPaid);
      const pendingAmount = pending.reduce((sum, r) => sum + r.roundUpAmount, 0);
      console.log('\nPending roundups: ' + pending.length + ' ($' + pendingAmount.toFixed(2) + ')');
    }

    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  } finally {
    await mongoose.disconnect();
  }
})();
