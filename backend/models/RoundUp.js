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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RoundUp', roundUpSchema);