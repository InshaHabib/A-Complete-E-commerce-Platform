import RecommendationService from '../services/recommendation.service.js';
import mongoose from 'mongoose';

class RecommendationController {
    // Track a product view
    async trackProductView(req, res) {
        try {
            const { productId } = req.params;
            const userId = req.user._id;

            // Validate if productId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format'
                });
            }

            const success = await RecommendationService.trackProductView(userId, productId);
            
            if (success) {
                return res.status(200).json({
                    success: true,
                    message: 'Product view tracked successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to track product view'
                });
            }
        } catch (error) {
            console.error('Error in trackProductView:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get recommended products
    async getRecommendedProducts(req, res) {
        try {
            const userId = req.user._id;
            const limit = parseInt(req.query.limit) || 10;

            const recommendedProducts = await RecommendationService.getRecommendedProducts(userId, limit);

            return res.status(200).json({
                success: true,
                data: recommendedProducts
            });
        } catch (error) {
            console.error('Error in getRecommendedProducts:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default new RecommendationController(); 