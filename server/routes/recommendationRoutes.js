const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const auth = require('../middleware/auth');

// Track user viewing a product
router.post('/track-view', auth, recommendationController.trackView);

// Track view duration
router.post('/track-view-duration', auth, recommendationController.trackViewDuration);

// Track user purchasing a product
router.post('/track-purchase', auth, recommendationController.trackPurchase);

// Get personalized recommendations
router.get('/recommendations', auth, recommendationController.getRecommendations);

// Update user preferences
router.post('/preferences', auth, recommendationController.updatePreferences);

// Get user preferences
router.get('/preferences', auth, recommendationController.getPreferences);

module.exports = router; 