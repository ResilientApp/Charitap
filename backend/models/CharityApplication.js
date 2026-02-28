const mongoose = require('mongoose');

const charityApplicationSchema = new mongoose.Schema({
  // Nomination info
  nominatedBy: { 
    type: String, 
    required: true 
  }, // User email who suggested
  
  // Basic charity info
  charityName: { 
    type: String, 
    required: true 
  },
  charityEmail: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  website: { 
    type: String,
    trim: true
  },
  description: { 
    type: String 
  },
  category: { 
    type: String,
    enum: ['Environment', 'Education', 'Health', 'Animals', 'Human Rights', 'Poverty', 'Arts & Culture', 'Other'],
    default: 'Other'
  },
  
  // Contact info
  contactName: { 
    type: String 
  },
  contactPhone: { 
    type: String 
  },
  
  // Legal
  ein: { 
    type: String // Tax ID / EIN
  },
  registrationNumber: { 
    type: String 
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Stripe (added by admin manually)
  stripeAccountId: { 
    type: String 
  },
  stripeOnboardingComplete: { 
    type: Boolean, 
    default: false 
  },
  
  // Admin review
  reviewedAt: { 
    type: Date 
  },
  reviewedBy: { 
    type: String // Admin email
  },
  approvedAt: { 
    type: Date 
  },
  rejectionReason: { 
    type: String 
  },
  adminNotes: { 
    type: String 
  },
}, {
  // Mongoose handles createdAt and updatedAt automatically for all update methods
  // (including findOneAndUpdate/updateOne) — no need for a pre('save') hook.
  timestamps: true
});

// Indexes for performance
charityApplicationSchema.index({ charityEmail: 1 });
charityApplicationSchema.index({ status: 1 });
charityApplicationSchema.index({ createdAt: -1 });
charityApplicationSchema.index({ nominatedBy: 1 });

module.exports = mongoose.model('CharityApplication', charityApplicationSchema);
