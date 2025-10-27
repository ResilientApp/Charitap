const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Only for traditional auth users
  googleId: { type: String, unique: true, sparse: true }, // For Google OAuth users
  authProvider: { type: String, enum: ['local', 'google'], required: true }, // Track auth method
  firstName: { type: String },
  lastName: { type: String },
  displayName: { type: String }, // For backward compatibility and Google OAuth
  profilePicture: { type: String }, // For Google profile picture
  
  // Stripe payment information (FROM GITHUB - CRITICAL FOR PAYMENTS)
  stripeCustomerId: { type: String },
  defaultPaymentMethod: { type: String }, // Stripe payment method ID
  paymentMethodLast4: { type: String }, // Last 4 digits for display
  paymentMethodBrand: { type: String }, // Card brand (Visa, Mastercard, etc)
  paymentMethodExpMonth: { type: Number }, // Expiration month
  paymentMethodExpYear: { type: Number }, // Expiration year
  
  // User preferences
  paymentPreference: { type: String, enum: ['threshold', 'monthly'], default: 'threshold' },
  selectedCharities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Charity' }],
  
  // Timestamps
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

// Note: Indexes for googleId and email are already created by unique: true in the schema

module.exports = mongoose.model('User', userSchema);
