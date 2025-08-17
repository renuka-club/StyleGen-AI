const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Design = require('../models/Design');

// Submit feedback for a design
router.post('/designs/:designId/feedback', async (req, res) => {
  try {
    const { designId } = req.params;
    const { rating, comment, feedbackType, tags, helpful } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if design exists
    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      designId,
      rating,
      comment: comment?.trim(),
      feedbackType: feedbackType || 'general',
      tags: tags || [],
      helpful,
      metadata: {
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
        sessionId: req.headers['x-session-id'] || 'anonymous'
      }
    });

    await feedback.save();

    // Update design with feedback stats
    const stats = await Feedback.getAverageRating(designId);
    await Design.findByIdAndUpdate(designId, {
      'feedback.averageRating': stats.averageRating,
      'feedback.totalCount': stats.totalFeedbacks,
      'feedback.lastUpdated': new Date()
    });

    res.json({
      success: true,
      data: {
        feedback,
        stats
      },
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get feedback for a design
router.get('/designs/:designId/feedback', async (req, res) => {
  try {
    const { designId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const summary = await Feedback.getFeedbackSummary(designId);
    
    // Paginate feedbacks
    const feedbacks = await Feedback.find({ designId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-metadata.userAgent');

    res.json({
      success: true,
      data: {
        feedbacks,
        stats: summary.stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: summary.stats.totalFeedbacks
        }
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

// Get feedback statistics
router.get('/designs/:designId/feedback/stats', async (req, res) => {
  try {
    const { designId } = req.params;
    
    const stats = await Feedback.getAverageRating(designId);
    
    // Get rating distribution
    const distribution = await Feedback.aggregate([
      { $match: { designId: require('mongoose').Types.ObjectId(designId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get common tags
    const commonTags = await Feedback.aggregate([
      { $match: { designId: require('mongoose').Types.ObjectId(designId) } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        distribution,
        commonTags: commonTags.map(tag => ({
          name: tag._id,
          count: tag.count
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback statistics'
    });
  }
});

// Update feedback (for moderation)
router.put('/feedback/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { helpful, moderationStatus } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        helpful,
        moderationStatus,
        'metadata.lastModified': new Date()
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback,
      message: 'Feedback updated successfully'
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback'
    });
  }
});

// Delete feedback
router.delete('/feedback/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Update design stats after deletion
    const stats = await Feedback.getAverageRating(feedback.designId);
    await Design.findByIdAndUpdate(feedback.designId, {
      'feedback.averageRating': stats.averageRating,
      'feedback.totalCount': stats.totalFeedbacks,
      'feedback.lastUpdated': new Date()
    });

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback'
    });
  }
});

// Get overall feedback analytics
router.get('/feedback/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchConditions = {};
    if (startDate && endDate) {
      matchConditions.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Feedback.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: analytics[0] || {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: []
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
