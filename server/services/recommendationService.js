import UserBehavior from '../models/UserBehavior.js';
import Product from '../models/product.modal.js';

class RecommendationService {
    // Track user viewing a product
    async trackView(userId, productId) {
        return UserBehavior.findOneAndUpdate(
            { userId },
            {
                $push: {
                    viewedProducts: {
                        productId,
                        timestamp: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            },
            { upsert: true, new: true }
        );
    }

    // Track user purchasing a product
    async trackPurchase(userId, productId, quantity) {
        return UserBehavior.findOneAndUpdate(
            { userId },
            {
                $push: {
                    purchasedProducts: {
                        productId,
                        quantity,
                        timestamp: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            },
            { upsert: true, new: true }
        );
    }

    // Get personalized recommendations for a user
    async getRecommendations(userId, limit = 10) {
        try {
            const userBehavior = await UserBehavior.findOne({ userId });
            if (!userBehavior) {
                return this.getPopularProducts(limit);
            }

            // Get recommendations based on different factors with weights
            const [viewBased, purchaseBased, preferenceBased] = await Promise.all([
                this.getViewBasedRecommendations(userBehavior, limit),
                this.getPurchaseBasedRecommendations(userBehavior, limit),
                this.getPreferenceBasedRecommendations(userBehavior, limit)
            ]);

            // Combine and deduplicate recommendations with weighted scoring
            const recommendations = this.combineRecommendations(
                viewBased,
                purchaseBased,
                preferenceBased,
                limit
            );

            return recommendations;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return this.getPopularProducts(limit);
        }
    }

    // Get recommendations based on viewed products with recency and duration weighting
    async getViewBasedRecommendations(userBehavior, limit) {
        const viewedProducts = userBehavior.viewedProducts;
        if (viewedProducts.length === 0) return [];

        // Sort by recency and calculate view scores
        const recentViews = viewedProducts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10); // Consider only recent views

        const viewedProductIds = recentViews.map(vp => vp.productId);
        const viewedProductsData = await Product.find({ _id: { $in: viewedProductIds } });
        
        // Get categories and calculate category weights based on view duration
        const categoryWeights = new Map();
        recentViews.forEach(view => {
            const product = viewedProductsData.find(p => p._id.toString() === view.productId.toString());
            if (product) {
                const weight = (view.duration || 1) * (1 / (Date.now() - view.timestamp));
                categoryWeights.set(product.category, (categoryWeights.get(product.category) || 0) + weight);
            }
        });

        // Find products in the same categories, weighted by category importance
        const categories = Array.from(categoryWeights.keys());
        const products = await Product.find({
            _id: { $nin: viewedProductIds },
            category: { $in: categories }
        }).sort({ rating: -1 });

        // Score products based on category weights and other factors
        const scoredProducts = products.map(product => ({
            product,
            score: (categoryWeights.get(product.category) || 0) * 
                   (1 + (product.rating / 5)) * 
                   (1 + (product.sales / 100))
        }));

        return scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.product);
    }

    // Get recommendations based on purchased products with purchase frequency weighting
    async getPurchaseBasedRecommendations(userBehavior, limit) {
        const purchasedProducts = userBehavior.purchasedProducts;
        if (purchasedProducts.length === 0) return [];

        // Calculate purchase frequency for each product
        const purchaseFrequency = new Map();
        purchasedProducts.forEach(purchase => {
            const count = purchaseFrequency.get(purchase.productId.toString()) || 0;
            purchaseFrequency.set(purchase.productId.toString(), count + purchase.quantity);
        });

        const purchasedProductIds = Array.from(purchaseFrequency.keys());
        const purchasedProductsData = await Product.find({ _id: { $in: purchasedProductIds } });

        // Get categories and calculate category weights based on purchase frequency
        const categoryWeights = new Map();
        purchasedProductsData.forEach(product => {
            const frequency = purchaseFrequency.get(product._id.toString());
            categoryWeights.set(product.category, (categoryWeights.get(product.category) || 0) + frequency);
        });

        // Find products in the same categories
        const categories = Array.from(categoryWeights.keys());
        const products = await Product.find({
            _id: { $nin: purchasedProductIds },
            category: { $in: categories }
        }).sort({ rating: -1 });

        // Score products based on category weights and other factors
        const scoredProducts = products.map(product => ({
            product,
            score: (categoryWeights.get(product.category) || 0) * 
                   (1 + (product.rating / 5)) * 
                   (1 + (product.sales / 100))
        }));

        return scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.product);
    }

    // Get recommendations based on user preferences with preference weighting
    async getPreferenceBasedRecommendations(userBehavior, limit) {
        const { preferences } = userBehavior;
        if (!preferences || !preferences.categories.length) return [];

        const query = {
            category: { $in: preferences.categories }
        };

        if (preferences.priceRange) {
            query.price = {
                $gte: preferences.priceRange.min,
                $lte: preferences.priceRange.max
            };
        }

        if (preferences.brands && preferences.brands.length) {
            query.brand = { $in: preferences.brands };
        }

        const products = await Product.find(query).sort({ rating: -1 });

        // Score products based on how well they match preferences
        const scoredProducts = products.map(product => ({
            product,
            score: (1 + (product.rating / 5)) * 
                   (1 + (product.sales / 100)) *
                   (preferences.brands?.includes(product.brand) ? 1.5 : 1)
        }));

        return scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.product);
    }

    // Get popular products as fallback with trending consideration
    async getPopularProducts(limit) {
        return Product.find()
            .sort({ 
                rating: -1, 
                sales: -1,
                createdAt: -1 // Consider recency for trending products
            })
            .limit(limit);
    }

    // Combine and deduplicate recommendations with weighted scoring
    combineRecommendations(viewBased, purchaseBased, preferenceBased, limit) {
        const allProducts = [
            ...viewBased.map(p => ({ product: p, weight: 1.0 })), // View-based weight
            ...purchaseBased.map(p => ({ product: p, weight: 1.5 })), // Purchase-based weight
            ...preferenceBased.map(p => ({ product: p, weight: 1.2 })) // Preference-based weight
        ];

        const uniqueProducts = new Map();

        // Add products with their weighted scores
        allProducts.forEach(({ product, weight }) => {
            const id = product._id.toString();
            const currentScore = uniqueProducts.get(id) || 0;
            uniqueProducts.set(id, currentScore + weight);
        });

        // Convert to array and sort by weighted score
        return Array.from(uniqueProducts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => allProducts.find(p => p.product._id.toString() === id).product);
    }

    // Track user behavior with enhanced data collection
    async trackUserBehavior(userId, data) {
        const { type, productId, duration, quantity } = data;
        
        const update = {};
        if (type === 'view') {
            update.$push = {
                viewedProducts: {
                    productId,
                    viewDuration: duration,
                    timestamp: new Date()
                }
            };
        } else if (type === 'purchase') {
            update.$push = {
                purchasedProducts: {
                    productId,
                    quantity,
                    timestamp: new Date()
                }
            };
        }

        update.$set = { lastUpdated: new Date() };

        return UserBehavior.findOneAndUpdate(
            { userId },
            update,
            { upsert: true, new: true }
        );
    }

    // Update user preferences with validation
    async updatePreferences(userId, preferences) {
        // Validate preferences
        if (preferences.priceRange) {
            if (preferences.priceRange.min > preferences.priceRange.max) {
                throw new Error('Invalid price range');
            }
        }

        return UserBehavior.findOneAndUpdate(
            { userId },
            {
                $set: {
                    preferences,
                    lastUpdated: new Date()
                }
            },
            { upsert: true, new: true }
        );
    }
}

export default new RecommendationService(); 