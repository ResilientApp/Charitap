const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Only for traditional auth users
  googleId: { type: String, unique: true, sparse: true }, // For Google OAuth users
  authProvider: { type: String, enum: ['local', 'google'], required: true }, // Track auth method
  firstName: { type: String },
  lastName: { type: String },
  stripeCustomerId: { type: String },
  paymentPreference: { type: String, enum: ['threshold', 'monthly'], default: 'threshold' },
  selectedCharities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Charity' }],
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName || this.firstName || this.lastName || '';
});

// Index for faster lookups
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);

