const express = require('express');
const router = express.Router();
const { authenticateToken, checkDesignLimit, optionalAuth } = require('../middleware/auth');
const { generateDesign: generateReplicateDesign, generateDesignVariations, testConnection: testReplicateConnection, getAvailableModels: getReplicateModels } = require('../config/replicate');
const { generateDesign: generateHuggingFaceDesign, testConnection: testHuggingFaceConnection, getAvailableModels: getHuggingFaceModels } = require('../config/huggingface');
const Design = require('../models/Design');
const User = require('../models/User');

// @route   GET /api/designs/models
// @desc    Get available AI models
// @access  Public
router.get('/models', async (req, res) => {
  try {
    const hfModels = getHuggingFaceModels();
    const replicateModels = getReplicateModels();

    res.json({
      success: true,
      models: [
        ...hfModels,
        ...replicateModels.map(model => ({ ...model, provider: 'Replicate (Backup)' }))
      ],
      primary: 'Hugging Face (FREE!)',
      backup: 'Replicate'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/designs/test/huggingface
// @desc    Test Hugging Face AI connection
// @access  Public
router.get('/test/huggingface', async (req, res) => {
  try {
    const result = await testHuggingFaceConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/designs/test/replicate
// @desc    Test Replicate AI connection (backup)
// @access  Public
router.get('/test/replicate', async (req, res) => {
  try {
    const result = await testReplicateConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   POST /api/designs/generate
// @desc    Generate a new fashion design
// @access  Public (for demo purposes, but now saves to database)
router.post('/generate', async (req, res) => {
  try {
    // For demo purposes, we'll work without user authentication but save to database
    const {
      gender,
      occasion,
      style,
      colors,
      patterns,
      materials,
      mood,
      season,
      customPrompt,
      modelType = 'sdxl' // Default to Stable Diffusion XL
    } = req.body;

    // Validate required fields
    if (!gender || !occasion || !style || !colors || colors.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide gender, occasion, style, and at least one color'
      });
    }

    // Create a demo user ID for database storage
    const mongoose = require('mongoose');
    const demoUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    // Create design document in database
    const design = new Design({
      userId: demoUserId,
      title: `${style} ${occasion} Design`,
      description: customPrompt || `AI-generated ${style} ${occasion} outfit for ${gender}`,
      inputParameters: {
        gender,
        occasion,
        style,
        colors,
        patterns: patterns || [],
        materials: materials || [],
        mood: mood || 'confident',
        season: season || 'all-season'
      },
      aiGeneration: {
        prompt: `Generating ${style} ${occasion} outfit for ${gender} with colors: ${colors.join(', ')}`,
        model: modelType || 'sdxl'
      },
      status: 'generating'
    });

    // Save initial design to database
    await design.save();
    console.log('💾 Design saved to database with ID:', design._id);

    // Generate the design using Hugging Face AI (FREE!)
    try {
      const startTime = Date.now();
      const generationResult = await generateHuggingFaceDesign({
        gender,
        occasion,
        style,
        colors,
        patterns,
        materials,
        mood,
        season
      }, modelType);
      const generationTime = Date.now() - startTime;

      // Update design with generated content and save to database
      design.images = [{
        url: generationResult.image.url,
        filename: `design_${design._id}_${Date.now()}.png`,
        isOriginal: true,
        dimensions: {
          width: 1024,
          height: 1024
        }
      }];

      design.aiGeneration = {
        prompt: generationResult.image.originalPrompt,
        model: generationResult.metadata.model,
        generationTime: generationTime,
        modelVersion: generationResult.metadata.modelVersion,
        parameters: {
          size: '1024x1024',
          modelVersion: generationResult.metadata.modelVersion
        }
      };

      design.status = 'completed';
      design.completedAt = new Date();

      // Save completed design to database
      await design.save();
      console.log('✅ Design generation completed and saved to database');

      res.json({
        success: true,
        message: 'Design generated and saved successfully',
        design: {
          id: design._id,
          title: design.title,
          description: design.description,
          images: design.images,
          inputParameters: design.inputParameters,
          aiGeneration: design.aiGeneration,
          status: design.status,
          createdAt: design.createdAt,
          completedAt: design.completedAt
        }
      });

    } catch (generationError) {
      // Update design status to failed and save error
      design.status = 'failed';
      design.error = {
        message: generationError.message,
        code: generationError.code || 'GENERATION_ERROR',
        timestamp: new Date()
      };
      await design.save();
      console.error('❌ Design generation failed, error saved to database');
      throw generationError;
    }

  } catch (error) {
    console.error('Design generation error:', error);
    
    res.status(500).json({
      error: 'Design generation failed',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   GET /api/designs/demo
// @desc    Get all designs (demo mode - no authentication)
// @access  Public
router.get('/demo', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { isArchived: false };
    if (status) {
      query.status = status;
    }

    const designs = await Design.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-aiGeneration.cost -error');

    const total = await Design.countDocuments(query);

    res.json({
      success: true,
      designs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Fetch designs error:', error);
    res.status(500).json({
      error: 'Failed to fetch designs',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/designs
// @desc    Get user's designs
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId: user._id, isArchived: false };
    if (status) {
      query.status = status;
    }

    const designs = await Design.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-aiGeneration.cost -error');

    const total = await Design.countDocuments(query);

    res.json({
      success: true,
      designs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Fetch designs error:', error);
    res.status(500).json({
      error: 'Failed to fetch designs',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/designs/:id
// @desc    Get specific design
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const designId = req.params.id;

    const design = await Design.findOne({
      _id: designId,
      userId: user._id,
      isArchived: false
    });

    if (!design) {
      return res.status(404).json({
        error: 'Design not found',
        message: 'The requested design does not exist or you do not have access to it'
      });
    }

    // Increment view count
    await design.incrementView();

    res.json({
      success: true,
      design
    });

  } catch (error) {
    console.error('Fetch design error:', error);
    res.status(500).json({
      error: 'Failed to fetch design',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/designs/:id/favorite
// @desc    Toggle favorite status
// @access  Private
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const designId = req.params.id;

    const design = await Design.findOne({
      _id: designId,
      userId: user._id
    });

    if (!design) {
      return res.status(404).json({
        error: 'Design not found'
      });
    }

    await design.toggleFavorite();

    res.json({
      success: true,
      message: design.interactions.isFavorited ? 'Added to favorites' : 'Removed from favorites',
      isFavorited: design.interactions.isFavorited
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      error: 'Failed to update favorite status',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/designs/:id/download
// @desc    Track design download
// @access  Private
router.post('/:id/download', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const designId = req.params.id;

    const design = await Design.findOne({
      _id: designId,
      userId: user._id
    });

    if (!design) {
      return res.status(404).json({
        error: 'Design not found'
      });
    }

    await design.addDownload();

    // Update user stats
    user.stats.downloadsCount++;
    await user.save();

    res.json({
      success: true,
      message: 'Download tracked successfully',
      downloadCount: design.interactions.downloads
    });

  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({
      error: 'Failed to track download',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/designs/public/gallery
// @desc    Get public designs gallery
// @access  Public
router.get('/public/gallery', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const designs = await Design.findPublicDesigns(limit)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      designs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Fetch gallery error:', error);
    res.status(500).json({
      error: 'Failed to fetch gallery',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/designs/:id/feedback
// @desc    Submit feedback for a design (demo mode)
// @access  Public
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id: designId } = req.params;
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

    // Import Feedback model
    const Feedback = require('../models/Feedback');

    // Create feedback
    const feedback = new Feedback({
      designId,
      userId: 'demo-user', // Demo mode
      rating,
      comment: comment?.trim(),
      feedbackType: feedbackType || 'general',
      tags: tags || [],
      helpful,
      metadata: {
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
        sessionId: req.headers['x-session-id'] || 'demo-session'
      }
    });

    await feedback.save();
    console.log('💬 Feedback saved to database:', feedback._id);

    // Get updated feedback stats
    const stats = await Feedback.getAverageRating(designId);

    res.json({
      success: true,
      data: {
        feedback,
        stats
      },
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      message: error.message
    });
  }
});

// @route   GET /api/designs/:id/feedback
// @desc    Get feedback for a design
// @access  Public
router.get('/:id/feedback', async (req, res) => {
  try {
    const { id: designId } = req.params;

    // Check if design exists
    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({
        success: false,
        error: 'Design not found'
      });
    }

    // Import Feedback model
    const Feedback = require('../models/Feedback');

    // Get feedback summary
    const feedbackSummary = await Feedback.getFeedbackSummary(designId);

    res.json({
      success: true,
      data: feedbackSummary
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback',
      message: error.message
    });
  }
});

module.exports = router;
