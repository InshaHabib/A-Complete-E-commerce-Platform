import mongoose from 'mongoose';

const userBehaviorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    viewedProducts: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        duration: {
            type: Number,
            default: 0
        }
    }],
    purchasedProducts: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        categories: [{
            type: String
        }],
        priceRange: {
            min: {
                type: Number,
                default: 0
            },
            max: {
                type: Number,
                default: 1000
            }
        },
        brands: [{
            type: String
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
userBehaviorSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index for faster queries
userBehaviorSchema.index({ userId: 1 });
userBehaviorSchema.index({ 'viewedProducts.productId': 1 });
userBehaviorSchema.index({ 'purchasedProducts.productId': 1 });

const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);

export default UserBehavior; 