import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    productID: {
        type: String,  // Keep as String since you're using custom IDs
        required: true,
        // Remove ref since it's not ObjectId
    },
    userEmail: {
        type: String,
        required: true,
        ref: "User",
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    userImage: {
        type: String,
        default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\..+/.test(v) || v.startsWith('data:image');
            },
            message: props => `${props.value} is not a valid image URL!`
        }
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: props => `${props.value} is not an integer value!`
        }
    },
    review: {
        type: String,
        maxlength: 500,
        trim: true
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function(v) {
                return v.length <= 5; // Max 5 images
            },
            message: 'Cannot have more than 5 images'
        }
    },
    helpfulCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "approved"
    }
}, {
    timestamps: true
});

// Compound index for unique user feedback per product
feedbackSchema.index({ productID: 1, userEmail: 1 }, { unique: true });

// Index for sorting and filtering
feedbackSchema.index({ productID: 1, rating: 1 });
feedbackSchema.index({ productID: 1, createdAt: -1 });
feedbackSchema.index({ userEmail: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ isVerifiedPurchase: 1 });

// Add a pre-save hook to ensure rating is integer
feedbackSchema.pre('save', function(next) {
    if (this.rating) {
        this.rating = Math.round(this.rating);
    }
    next();
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;