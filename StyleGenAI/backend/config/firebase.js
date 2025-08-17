const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      // For development, we'll use a service account key file
      // In production, you should use environment variables
      
      if (process.env.FIREBASE_PROJECT_ID) {
        // Initialize with environment variables (production)
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
          token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });

        console.log('🔥 Firebase Admin initialized with environment variables');
      } else {
        console.log('⚠️  Firebase not configured - authentication will be disabled');
        console.log('💡 To enable Firebase Auth:');
        console.log('   1. Create a Firebase project at https://console.firebase.google.com');
        console.log('   2. Generate a service account key');
        console.log('   3. Set the environment variables in .env file');
        return null;
      }
    }

    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    console.log('⚠️  Continuing without Firebase authentication...');
    return null;
  }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }

    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

// Create custom token
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }

    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    throw new Error(`Failed to create custom token: ${error.message}`);
  }
};

// Set custom user claims
const setCustomUserClaims = async (uid, customClaims) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase not initialized');
    }

    await admin.auth().setCustomUserClaims(uid, customClaims);
    return true;
  } catch (error) {
    throw new Error(`Failed to set custom claims: ${error.message}`);
  }
};

module.exports = {
  initializeFirebase,
  verifyIdToken,
  getUserByUid,
  createCustomToken,
  setCustomUserClaims,
  admin
};
