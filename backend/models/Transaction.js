const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  stripeTransactionId: { type: String }, // The transfer to charity
  stripePaymentIntentId: { type: String }, // The charge to user (FROM GITHUB)
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
  timestamp: { type: Date, default: Date.now },
  // Blockchain fields
  blockchainTxId: { type: String }, // ResilientDB transaction ID
  blockchainTxKey: { type: String }, // Ledger key (charitap:transaction:{id})
  blockchainVerified: { type: Boolean, default: false },
  blockchainTimestamp: { type: Date },
  blockchainError: { type: String } // Store any blockchain errors
});

module.exports = mongoose.model('Transaction', transactionSchema);
