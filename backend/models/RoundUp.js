// models/RoundUp.js
const mongoose = require('mongoose');

const roundUpSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  purchaseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  roundUpAmount: {
    type: Number,
    required: true,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  // Payment tracking (FROM GITHUB - CRITICAL FOR STRIPE INTEGRATION)
  stripePaymentIntentId: {
    type: String
  }, // The charge to the user (batched)
  chargedAt: {
    type: Date
  }, // When user was charged
  processedAt: {
    type: Date
  }, // When transferred to charity

  // Blockchain tracking (NEW - ResilientDB)
  blockchainTxKey: {
    type: String,
    index: true  // For quick lookups on blockchain
  }, // The ledger key used in ResilientDB
  blockchainTxId: {
    type: String
  }, // Transaction ID returned from blockchain
  blockchainVerified: {
    type: Boolean,
    default: false
  }, // Whether successfully written to blockchain
  blockchainTimestamp: {
    type: Date
  }, // When written to blockchain
  blockchainError: {
    type: String
  }, // Error message if blockchain write failed
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Database Indexes for Performance
roundUpSchema.index({ user: 1, createdAt: -1 });
roundUpSchema.index({ blockchainTxId: 1 }, { sparse: true });
roundUpSchema.index({ isPaid: 1, createdAt: -1 });
roundUpSchema.index({ blockchainVerified: 1 });

module.exports = mongoose.model('RoundUp', roundUpSchema);
