import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        productID: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            index: true
        },
        altName: { 
            type: [String],
            default: []
        },
        description: {
            type: String,
            required: true
        },
        images: {
            type: [String],
            default: [],
            required: true,
            validate: {
                validator: function(v) {
                    return v.length > 0;
                },
                message: 'At least one image is required'
            }
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            index: true
        },
        labelledPrice: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function(value) {
                    return value >= this.price;
                },
                message: 'Labelled price must be greater than or equal to price'
            }
        },
        category: {
            type: String,
            required: true,
            index: true
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        totalReviews: {
            type: Number,
            default: 0
        },
        ratingBreakdown: {
            "5": { type: Number, default: 0 },
            "4": { type: Number, default: 0 },
            "3": { type: Number, default: 0 },
            "2": { type: Number, default: 0 },
            "1": { type: Number, default: 0 }
        }
    },
    {
        timestamps: true
    }
);


productSchema.index({ category: 1, price: 1 });
productSchema.index({ category: 1, averageRating: -1 });
productSchema.index({ name: 'text', description: 'text' }); 

const Product = mongoose.model("Product", productSchema);
export default Product;