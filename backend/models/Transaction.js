const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Stripe IDs - unique sparse indexes prevent duplicates while allowing null/missing values
  stripeTransactionId: { type: String, unique: true, sparse: true }, // The transfer to charity
  stripePaymentIntentId: { type: String, unique: true, sparse: true }, // The charge to user
  userEmail: { type: String, required: true },
  // min: 0.01 prevents zero or negative donation amounts from being recorded
  amount: { type: Number, required: true, min: [0.01, 'Donation amount must be at least $0.01'] },
  charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true },
  timestamp: { type: Date, default: Date.now },
  // Blockchain fields
  blockchainTxId: { type: String }, // ResilientDB transaction ID
  blockchainTxKey: { type: String }, // Ledger key (charitap:transaction:{id})
  blockchainVerified: { type: Boolean, default: false },
  blockchainTimestamp: { type: Date },
  blockchainError: { type: String }, // Store any blockchain errors
  // Smart contract receipt (from ResContract DonationReceipt.sol)
  contractReceiptId: { type: String } // Receipt ID returned by the on-chain contract
});

// Explicit sparse unique indexes for Stripe IDs
transactionSchema.index({ stripeTransactionId: 1 }, { unique: true, sparse: true });
transactionSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
