// models/RoundUp.js
const mongoose = require('mongoose');

const roundUpSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  purchaseAmount: {
    type: Number,
    required: true
  },
  roundUpAmount: {
    type: Number,
    required: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RoundUp', roundUpSchema);
