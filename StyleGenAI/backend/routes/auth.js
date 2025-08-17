const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/auth/verify
// @desc    Verify Firebase token and get/create user
// @access  Public
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const firebaseUser = req.firebaseUser;

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        preferences: user.preferences,
        subscription: {
          plan: user.subscription.plan,
          designsRemaining: user.subscription.designsRemaining
        },
        stats: user.stats,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      firebaseUser: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.email_verified
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Failed to verify authentication'
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        preferences: user.preferences,
        subscription: user.subscription,
        stats: user.stats,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;

    // Allowed fields to update
    const allowedUpdates = [
      'displayName',
      'preferences.gender',
      'preferences.favoriteStyles',
      'preferences.favoriteColors',
      'preferences.preferredMaterials',
      'preferences.bodyType',
      'preferences.budgetRange'
    ];

    // Filter and apply updates
    const updateData = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key.includes('.')) {
          // Handle nested updates
          const [parent, child] = key.split('.');
          if (!updateData[parent]) updateData[parent] = {};
          updateData[parent][child] = updates[key];
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    // Update user
    Object.assign(user, updateData);
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        preferences: user.preferences,
        subscription: user.subscription,
        stats: user.stats,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Mark account as inactive instead of deleting
    user.isActive = false;
    user.isArchived = true;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      stats: {
        totalDesigns: user.stats.totalDesigns,
        favoriteDesigns: user.stats.favoriteDesigns,
        downloadsCount: user.stats.downloadsCount,
        lastActiveAt: user.stats.lastActiveAt,
        memberSince: user.createdAt,
        subscription: {
          plan: user.subscription.plan,
          designsRemaining: user.subscription.designsRemaining
        }
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/refresh-limits
// @desc    Refresh design limits (for testing)
// @access  Private
router.post('/refresh-limits', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Reset design limits based on plan
    const limits = {
      free: 5,
      premium: 50,
      pro: -1 // unlimited
    };

    user.subscription.designsRemaining = limits[user.subscription.plan] || 5;
    await user.save();

    res.json({
      success: true,
      message: 'Design limits refreshed',
      designsRemaining: user.subscription.designsRemaining
    });
  } catch (error) {
    console.error('Limit refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh limits',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
