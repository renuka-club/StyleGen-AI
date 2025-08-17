const { verifyIdToken } = require('../config/firebase');
const User = require('../models/User');

// Middleware to verify Firebase ID token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No authorization header provided' 
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(token);
    
    // Find or create user in our database
    let user = await User.findByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null,
        isEmailVerified: decodedToken.email_verified || false
      });
      
      await user.save();
      console.log(`👤 New user created: ${user.email}`);
    } else {
      // Update last active time
      user.stats.lastActiveAt = Date.now();
      await user.save();
    }

    // Add user info to request object
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.message.includes('Token verification failed')) {
      return res.status(401).json({ 
        error: 'Invalid token', 
        message: 'The provided token is invalid or expired' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Authentication failed', 
      message: 'Internal server error during authentication' 
    });
  }
};

// Middleware to check if user can generate designs
const checkDesignLimit = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user.canGenerateDesign()) {
      return res.status(403).json({
        error: 'Design limit reached',
        message: 'You have reached your design generation limit. Please upgrade your plan.',
        remainingDesigns: user.subscription.designsRemaining,
        plan: user.subscription.plan
      });
    }
    
    next();
  } catch (error) {
    console.error('Design limit check error:', error.message);
    return res.status(500).json({ 
      error: 'Failed to check design limit', 
      message: 'Internal server error' 
    });
  }
};

// Middleware to check subscription plan
const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    const user = req.user;
    const planHierarchy = { 'free': 0, 'premium': 1, 'pro': 2 };
    
    const userPlanLevel = planHierarchy[user.subscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;
    
    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        error: 'Insufficient plan',
        message: `This feature requires ${requiredPlan} plan or higher`,
        currentPlan: user.subscription.plan,
        requiredPlan: requiredPlan
      });
    }
    
    next();
  };
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      req.firebaseUser = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      req.firebaseUser = null;
      return next();
    }

    // Try to verify token
    const decodedToken = await verifyIdToken(token);
    const user = await User.findByFirebaseUid(decodedToken.uid);
    
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    // If authentication fails, continue without user
    req.user = null;
    req.firebaseUser = null;
    next();
  }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  checkDesignLimit,
  requirePlan,
  optionalAuth,
  requireAdmin
};
