import RecommendationService from '../services/recommendationService.js';
import UserBehavior from '../models/UserBehavior.js';

// Track user viewing a product
export const trackView = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        await RecommendationService.trackView(userId, productId);
        res.status(200).json({ message: 'View tracked successfully' });
    } catch (error) {
        console.error('Error tracking view:', error);
        res.status(500).json({ message: 'Error tracking view' });
    }
};

// Track user purchasing a product
export const trackPurchase = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user._id;

        await RecommendationService.trackPurchase(userId, productId, quantity);
        res.status(200).json({ message: 'Purchase tracked successfully' });
    } catch (error) {
        console.error('Error tracking purchase:', error);
        res.status(500).json({ message: 'Error tracking purchase' });
    }
};

// Get personalized recommendations
export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        const recommendations = await RecommendationService.getRecommendations(userId);
        res.status(200).json({ data: recommendations });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ message: 'Error getting recommendations' });
    }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        const preferences = req.body;

        await UserBehavior.findOneAndUpdate(
            { userId },
            { 
                $set: { 
                    preferences,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Error updating preferences' });
    }
};

// Get user preferences
export const getPreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        const userBehavior = await UserBehavior.findOne({ userId });
        
        if (!userBehavior || !userBehavior.preferences) {
            return res.status(200).json({ 
                data: {
                    categories: [],
                    priceRange: { min: 0, max: 1000 },
                    brands: []
                }
            });
        }

        res.status(200).json({ data: userBehavior.preferences });
    } catch (error) {
        console.error('Error getting preferences:', error);
        res.status(500).json({ message: 'Error getting preferences' });
    }
};

// Track view duration
export const trackViewDuration = async (req, res) => {
    try {
        const { productId, duration } = req.body;
        const userId = req.user._id;

        await UserBehavior.findOneAndUpdate(
            { 
                userId,
                'viewedProducts.productId': productId
            },
            {
                $set: {
                    'viewedProducts.$.duration': duration,
                    updatedAt: new Date()
                }
            }
        );

        res.status(200).json({ message: 'View duration tracked successfully' });
    } catch (error) {
        console.error('Error tracking view duration:', error);
        res.status(500).json({ message: 'Error tracking view duration' });
    }
}; 