const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  stripeCustomerId: { type: String },
  paymentPreference: {type: String},
  selectedCharity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' }
});

module.exports = mongoose.model('User', userSchema);

