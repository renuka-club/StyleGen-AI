const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    required: true
  },
  userId: {
    type: String,
    default: 'anonymous'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  feedbackType: {
    type: String,
    enum: ['design_quality', 'accuracy', 'creativity', 'general'],
    default: 'general'
  },
  helpful: {
    type: Boolean,
    default: null
  },
  tags: [{
    type: String,
    enum: ['colors', 'style', 'fit', 'creativity', 'accuracy', 'quality', 'other']
  }],
  metadata: {
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    sessionId: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ designId: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ feedbackType: 1 });

// Virtual for average rating calculation
feedbackSchema.virtual('isPositive').get(function() {
  return this.rating >= 4;
});

// Static method to get average rating for a design
feedbackSchema.statics.getAverageRating = async function(designId) {
  const result = await this.aggregate([
    { $match: { designId: new mongoose.Types.ObjectId(designId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
        positiveCount: {
          $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
        }
      }
    }
  ]);

  return result.length > 0 ? result[0] : {
    averageRating: 0,
    totalFeedbacks: 0,
    positiveCount: 0
  };
};

// Static method to get feedback summary
feedbackSchema.statics.getFeedbackSummary = async function(designId) {
  const feedbacks = await this.find({ designId }).sort({ createdAt: -1 });
  const stats = await this.getAverageRating(designId);
  
  return {
    feedbacks,
    stats,
    recentFeedback: feedbacks[0] || null
  };
};

module.exports = mongoose.model('Feedback', feedbackSchema);
