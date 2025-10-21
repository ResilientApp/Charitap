const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  stripeTransactionId: { type: String }, 
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
