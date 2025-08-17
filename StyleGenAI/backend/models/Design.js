const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  // User who created this design
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Design metadata
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // User input parameters
  inputParameters: {
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex', 'other'],
      required: true
    },
    
    occasion: {
      type: String,
      enum: ['casual', 'formal', 'business', 'party', 'wedding', 'vacation', 'sports', 'date', 'interview'],
      required: true
    },
    
    style: {
      type: String,
      enum: ['vintage', 'modern', 'bohemian', 'minimalist', 'streetwear', 'classic', 'trendy', 'elegant'],
      required: true
    },
    
    colors: [{
      type: String,
      required: true
    }],
    
    patterns: [{
      type: String,
      enum: ['solid', 'stripes', 'floral', 'geometric', 'polka-dots', 'animal-print', 'abstract', 'plaid']
    }],
    
    materials: [{
      type: String,
      enum: ['cotton', 'silk', 'wool', 'linen', 'polyester', 'denim', 'leather', 'chiffon', 'satin', 'velvet']
    }],
    
    mood: {
      type: String,
      enum: ['confident', 'romantic', 'edgy', 'comfortable', 'professional', 'playful', 'sophisticated'],
      default: 'confident'
    },
    
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all-season'],
      default: 'all-season'
    }
  },
  
  // AI generation details
  aiGeneration: {
    prompt: {
      type: String,
      required: true
    },
    
    model: {
      type: String,
      enum: ['sdxl', 'sd15', 'flux', 'playground', 'dall-e-3', 'dall-e-2'],
      default: 'sdxl'
    },
    
    parameters: {
      size: { type: String, default: '1024x1024' },
      modelVersion: { type: String },
      guidanceScale: { type: Number, default: 7.5 },
      inferenceSteps: { type: Number, default: 50 }
    },
    
    generationTime: { type: Number }, // in milliseconds
    cost: { type: Number, default: 0 } // in USD
  },
  
  // Generated images
  images: [{
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number }, // file size in bytes
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    },
    isOriginal: { type: Boolean, default: true },
    variations: [{ // For image variations/edits
      url: String,
      filename: String,
      editType: String // 'variation', 'upscale', 'edit'
    }]
  }],
  
  // User interactions
  interactions: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    
    isFavorited: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    
    feedback: {
      liked: [String], // What user liked about the design
      disliked: [String], // What user didn't like
      suggestions: String // User suggestions for improvement
    }
  },
  
  // Export and sharing
  exports: [{
    format: {
      type: String,
      enum: ['pdf', 'png', 'jpg', 'tech-pack'],
      required: true
    },
    url: String,
    filename: String,
    exportedAt: { type: Date, default: Date.now }
  }],
  
  // Status and visibility
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'archived'],
    default: 'generating'
  },
  
  isPublic: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  
  // Error handling
  error: {
    message: String,
    code: String,
    timestamp: Date
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date
});

// Update the updatedAt field before saving
designSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  next();
});

// Instance methods
designSchema.methods.incrementView = function() {
  this.interactions.views++;
  return this.save();
};

designSchema.methods.toggleFavorite = function() {
  this.interactions.isFavorited = !this.interactions.isFavorited;
  return this.save();
};

designSchema.methods.addDownload = function() {
  this.interactions.downloads++;
  return this.save();
};

// Static methods
designSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isArchived: false }).sort({ createdAt: -1 });
};

designSchema.statics.findPublicDesigns = function(limit = 20) {
  return this.find({ isPublic: true, status: 'completed' })
    .sort({ 'interactions.likes': -1, createdAt: -1 })
    .limit(limit)
    .populate('userId', 'displayName photoURL');
};

// Indexes for better performance
designSchema.index({ userId: 1, createdAt: -1 });
designSchema.index({ status: 1 });
designSchema.index({ isPublic: 1, 'interactions.likes': -1 });
designSchema.index({ 'inputParameters.occasion': 1 });
designSchema.index({ 'inputParameters.style': 1 });

module.exports = mongoose.model('Design', designSchema);
