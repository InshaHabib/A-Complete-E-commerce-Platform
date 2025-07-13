import express from 'express';
import { trackView, trackPurchase, getRecommendations, updatePreferences, getPreferences, trackViewDuration } from '../controllers/recommendationController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Track user viewing a product
router.post('/track-view', auth, trackView);

// Track view duration
router.post('/track-view-duration', auth, trackViewDuration);

// Track user purchasing a product
router.post('/track-purchase', auth, trackPurchase);

// Get personalized recommendations
router.get('/recommendations', auth, getRecommendations);

// Update user preferences
router.post('/preferences', auth, updatePreferences);

// Get user preferences
router.get('/preferences', auth, getPreferences);

export default router; 