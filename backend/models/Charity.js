const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['Environment', 'Education', 'Health', 'Animals', 'Human Rights', 'Poverty', 'Arts & Culture', 'Other'],
    default: 'Other'
  },
  stripeAccountId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Charity', charitySchema);
