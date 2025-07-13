import mongoose from 'mongoose';

const productViewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound index for efficient querying
productViewSchema.index({ userId: 1, productId: 1 });

const ProductViewModel = mongoose.model('ProductView', productViewSchema);

export default ProductViewModel; 