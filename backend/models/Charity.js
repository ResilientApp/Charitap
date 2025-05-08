const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  stripeAccountId: { type: String, required: true }
});

module.exports = mongoose.model('Charity', charitySchema);
