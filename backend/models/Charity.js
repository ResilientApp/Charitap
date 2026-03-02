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
  image: { type: String, default: 'https://via.placeholder.com/300x200?text=Charity' }, // Backward compatible default image
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Charity', charitySchema);
