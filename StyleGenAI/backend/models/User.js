const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Firebase UID for authentication
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  photoURL: {
    type: String,
    default: null
  },
  
  // User preferences
  preferences: {
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex', 'other'],
      default: 'unisex'
    },
    
    favoriteStyles: [{
      type: String,
      enum: ['casual', 'formal', 'business', 'party', 'wedding', 'vacation', 'sports', 'vintage', 'bohemian', 'minimalist', 'streetwear']
    }],
    
    favoriteColors: [{
      type: String
    }],
    
    preferredMaterials: [{
      type: String,
      enum: ['cotton', 'silk', 'wool', 'linen', 'polyester', 'denim', 'leather', 'chiffon', 'satin', 'velvet']
    }],
    
    bodyType: {
      type: String,
      enum: ['petite', 'tall', 'plus-size', 'athletic', 'curvy', 'straight', 'other'],
      default: 'other'
    },
    
    budgetRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 1000 }
    }
  },
  
  // Usage statistics
  stats: {
    totalDesigns: { type: Number, default: 0 },
    favoriteDesigns: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now }
  },
  
  // Subscription/Plan information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    
    designsRemaining: { type: Number, default: 5 }, // Free tier limit
    
    subscriptionStart: { type: Date },
    subscriptionEnd: { type: Date },
    
    stripeCustomerId: { type: String }
  },
  
  // Account status
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
userSchema.methods.canGenerateDesign = function() {
  if (this.subscription.plan !== 'free') return true;
  return this.subscription.designsRemaining > 0;
};

userSchema.methods.decrementDesigns = function() {
  if (this.subscription.plan === 'free' && this.subscription.designsRemaining > 0) {
    this.subscription.designsRemaining--;
  }
  this.stats.totalDesigns++;
  this.stats.lastActiveAt = Date.now();
};

// Static methods
userSchema.statics.findByFirebaseUid = function(uid) {
  return this.findOne({ firebaseUid: uid });
};

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ 'stats.lastActiveAt': -1 });
userSchema.index({ 'subscription.plan': 1 });

module.exports = mongoose.model('User', userSchema);
