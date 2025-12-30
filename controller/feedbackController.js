import Feedback from "../models/feedback.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import { isAdmin, isCustomer } from "./userController.js";

// Calculate and update product rating statistics
async function updateProductRatings(productID) {
    try {
        const feedbacks = await Feedback.find({ 
            productID: productID,
            status: "approved"
        });
        
        if (feedbacks.length === 0) {
            await Product.updateOne(
                { productID: productID },
                {
                    averageRating: 0,
                    totalRatings: 0,
                    totalReviews: 0,
                    ratingBreakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }
                }
            );
            return;
        }

        const totalRatings = feedbacks.length;
        const totalReviews = feedbacks.filter(f => f.review && f.review.trim()).length;
        const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
        const averageRating = totalRating / totalRatings;

        // Calculate rating breakdown
        const ratingBreakdown = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
        feedbacks.forEach(f => {
            ratingBreakdown[f.rating.toString()]++;
        });

        await Product.updateOne(
            { productID: productID },
            {
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalRatings: totalRatings,
                totalReviews: totalReviews,
                ratingBreakdown: ratingBreakdown
            }
        );
    } catch (error) {
        console.error("Error updating product ratings:", error);
    }
}

// Submit feedback/rating
export async function submitFeedback(req, res) {
    try { 
        console.log("=== SUBMIT FEEDBACK REQUEST ===");
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);
        console.log("User:", req.user);
        console.log("Token present:", !!req.headers.authorization);

        const user = req.user;
        if (!user) {
            console.log("No user found in request");
            return res.status(401).json({ 
                message: "Please login to submit feedback",
                code: "UNAUTHORIZED" 
            });
        }

        const { productID, rating, review, images } = req.body;
        if (!productID) {
            return res.status(400).json({ 
                message: "Product ID is required",
                code: "MISSING_PRODUCT_ID" 
            });
        }

        // Validate rating
        if (typeof rating !== 'number' || isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                message: "Rating must be a number between 1 and 5",
                code: "INVALID_RATING" 
            });
        }

        // Also ensure it's an integer
        const ratingInt = Math.round(rating);
        if (ratingInt !== rating) {
            return res.status(400).json({ 
                message: "Rating must be a whole number (1, 2, 3, 4, or 5)",
                code: "INVALID_RATING" 
            });
        }

        // Validate review length
        if (review && review.length > 500) {
            return res.status(400).json({ 
                message: "Review cannot exceed 500 characters",
                code: "REVIEW_TOO_LONG" 
            });
        }

        // Validate images array if provided
        if (images && (!Array.isArray(images) || images.length > 5)) {
            return res.status(400).json({ 
                message: "Images must be an array with maximum 5 items",
                code: "INVALID_IMAGES" 
            });
        }

        // Check if product exists
        const product = await Product.findOne({ productID: productID });
        if (!product) {
            return res.status(404).json({ 
                message: "Product not found", 
                code: "PRODUCT_NOT_FOUND",
                productID: productID  
            });
        }

        // Check if user has purchased this product (optional verification)
        let isVerifiedPurchase = false;

        // Only check for regular users (not admins)
        if (user.role === "user") {
            const order = await Order.findOne({
                email: user.email,
                "items.productID": productID,
                status: { $in: ["completed", "shipped", "processing"] }
            });
            isVerifiedPurchase = !!order;
            console.log("Verified purchase check:", isVerifiedPurchase);
        }

        // Check if user already submitted feedback for this product
        const existingFeedback = await Feedback.findOne({
            productID: productID,
            userEmail: user.email
        });
        console.log("Existing feedback:", existingFeedback);

        let feedback;
        if (existingFeedback) {
            // Update existing feedback
            feedback = await Feedback.findOneAndUpdate(
                { productID: productID, userEmail: user.email },
                {
                    rating: rating,
                    review: (review && review.trim()) || "",
                    images: images || [],
                    isVerifiedPurchase: existingFeedback.isVerifiedPurchase,
                    updatedAt: new Date()
                },
                { new: true }
            );
            console.log("Updated feedback:", feedback);
        } else {
            // Create new feedback
            feedback = new Feedback({
                productID: productID,
                userEmail: user.email,
                userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split('@')[0] || "Anonymous User",
                userImage: user.image || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
                rating: rating,
                review: (review && review.trim()) || "",
                images: images || [],
                isVerifiedPurchase: isVerifiedPurchase,
                status: "approved" 
            });
            await feedback.save();
            console.log("Created new feedback:", feedback);
        }

        // Update product rating statistics
        await updateProductRatings(productID);

        console.log("Product ratings updated");

        res.status(200).json({
            message: existingFeedback ? "Feedback updated successfully" : "Feedback submitted successfully",
            feedback: feedback,
            code: "SUCCESS"
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        res.status(500).json({ 
            message: "Failed to submit feedback",
            code: "SERVER_ERROR",
            error: error.message 
        });
    }
}

// Get all feedback for a product
export async function getProductFeedback(req, res) {
    try {
        const { productID } = req.params;
        const { 
            sortBy = "newest", 
            minRating = 0,
            page = 1, 
            limit = 10,
            withImagesOnly = false 
        } = req.query;

        const query = { 
            productID: productID,
            status: "approved"
        };

        // Filter by minimum rating
        if (minRating > 0) {
            query.rating = { $gte: parseInt(minRating) };
        }

        // Filter by images
        if (withImagesOnly === "true") {
            query.images = { $exists: true, $ne: [] };
        }

        // Sort options
        let sort = {};
        switch (sortBy) {
            case "newest":
                sort.createdAt = -1;
                break;
            case "oldest":
                sort.createdAt = 1;
                break;
            case "highest":
                sort.rating = -1;
                break;
            case "lowest":
                sort.rating = 1;
                break;
            case "mostHelpful":
                sort.helpfulCount = -1;
                break;
            default:
                sort.createdAt = -1;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const feedbacks = await Feedback.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Feedback.countDocuments(query);

        // Get user's feedback if logged in
        let userFeedback = null;
        if (req.user) {
            userFeedback = await Feedback.findOne({
                productID: productID,
                userEmail: req.user.email
            });
        }

        res.status(200).json({
            feedbacks: feedbacks,
            userFeedback: userFeedback,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                hasNext: skip + feedbacks.length < total,
                hasPrevious: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error("=== ERROR IN GET PRODUCT FEEDBACK ===");
        console.error("Error:", error);
        console.error("Error stack:", error.stack);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "You have already submitted feedback for this product",
                code: "DUPLICATE_FEEDBACK" 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: "Validation error: " + Object.values(error.errors).map(e => e.message).join(', '),
                code: "VALIDATION_ERROR" 
            });
        }

        res.status(500).json({ 
            message: "Failed to fetch product feedback",
            code: "SERVER_ERROR",
            error: error.message 
        });
    }
}

// Get feedback statistics for a product
export async function getFeedbackStats(req, res) {
    try {
        const { productID } = req.params;

        const stats = await Feedback.aggregate([
            { 
                $match: { 
                    productID: productID,
                    status: "approved"
                }
            },
            {
                $group: {
                    _id: "$productID",
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                    totalReviews: { 
                        $sum: { 
                            $cond: [
                                { $and: [
                                    { $ne: ["$review", null] },
                                    { $ne: ["$review", ""] }
                                ]},
                                1, 0
                            ]
                        }
                    },
                    ratingBreakdown: {
                        $push: "$rating"
                    },
                    verifiedPurchases: {
                        $sum: { $cond: ["$isVerifiedPurchase", 1, 0] }
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                averageRating: 0,
                totalRatings: 0,
                totalReviews: 0,
                ratingBreakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
                verifiedPurchases: 0
            });
        }

        // Calculate rating breakdown
        const breakdown = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
        stats[0].ratingBreakdown.forEach(rating => {
            breakdown[rating.toString()]++;
        });

        res.json({
            averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
            totalRatings: stats[0].totalRatings,
            totalReviews: stats[0].totalReviews,
            ratingBreakdown: breakdown,
            verifiedPurchases: stats[0].verifiedPurchases
        });
    } catch (error) {
        console.error("Error fetching feedback stats:", error);
        res.status(500).json({ 
            message: "Failed to fetch feedback statistics",
            code: "SERVER_ERROR",
            error: error.message 
        });
    }
}

// Mark feedback as helpful
export async function markAsHelpful(req, res) {
    try {
        const { feedbackId } = req.params;
        
        const feedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { $inc: { helpfulCount: 1 } },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        res.json({
            message: "Marked as helpful",
            helpfulCount: feedback.helpfulCount
        });
    } catch (error) {
        console.error("Error marking as helpful:", error);
        res.status(500).json({ 
            message: "Failed to mark as helpful",
            code: "SERVER_ERROR",
            error: error.message 
        });
    }
}

// Admin: Get all feedback (for moderation)
export async function getAllFeedback(req, res) {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        const { status, productID, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (productID) query.productID = productID;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const feedbacks = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Feedback.countDocuments(query);

        res.json({
            feedbacks: feedbacks,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total
            }
        });
    } catch (error) {
        console.error("Error fetching all feedback:", error);
        res.status(500).json({ 
            message: "Failed to fetch feedback",
            code: "SERVER_ERROR",
            error: error.message 
        });
    }
}

// Admin: Update feedback status
export async function updateFeedbackStatus(req, res) {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({ message: "Access forbidden" });
        }

        const { feedbackId } = req.params;
        const { status } = req.body;

        if (!["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { status: status },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Update product ratings if status changed
        if (status === "approved" || status === "rejected") {
            await updateProductRatings(feedback.productID);
        }

        res.json({
            message: `Feedback ${status} successfully`,
            feedback: feedback
        });
    } catch (error) {
        console.error("Error updating feedback status:", error);
        res.status(500).json({ 
            message: "Failed to update feedback status",
            code: "SERVER_ERROR",
            error: error.message 
        });
    }
}

// Delete user's own feedback
export async function deleteFeedback(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Please login" });
        }

        const { feedbackId } = req.params;

        const feedback = await Feedback.findOne({
            _id: feedbackId,
            userEmail: user.email
        });

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found or not authorized" });
        }

        const productID = feedback.productID;
        await Feedback.deleteOne({ _id: feedbackId });

        // Update product ratings
        await updateProductRatings(productID);

        res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        res.status(500).json({ 
            message: "Failed to delete feedback",
            code: "SERVER_ERROR",
            error: error.message 
        });
    }
}

export async function testFeedback(req, res) {
    console.log("Test feedback endpoint hit");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("User:", req.user);
    
    res.json({
        message: "Feedback API is working",
        headers: req.headers,
        body: req.body,
        user: req.user
    });
}