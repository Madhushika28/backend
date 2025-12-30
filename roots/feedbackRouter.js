import express from "express";
import {
    submitFeedback,
    getProductFeedback,
    getFeedbackStats,
    markAsHelpful,
    getAllFeedback,
    updateFeedbackStatus,
    deleteFeedback,
    testFeedback
} from "../controller/feedbackController.js";
import { verifyUser, verifyAdmin } from "../middleware/authMiddleware.js";

const feedbackRouter = express.Router();

// Public routes
feedbackRouter.get("/test", testFeedback);
feedbackRouter.get("/product/:productID", getProductFeedback);
feedbackRouter.get("/product/:productID/stats", getFeedbackStats);
feedbackRouter.post("/:feedbackId/helpful", markAsHelpful);

// User routes (require authentication)
feedbackRouter.post("/", verifyUser, submitFeedback);
feedbackRouter.delete("/:feedbackId", verifyUser, deleteFeedback);

// Admin routes (require admin)
feedbackRouter.get("/", verifyAdmin, getAllFeedback);
feedbackRouter.put("/:feedbackId/status", verifyAdmin, updateFeedbackStatus);

export default feedbackRouter;
