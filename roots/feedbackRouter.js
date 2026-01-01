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

feedbackRouter.get("/test", testFeedback);
feedbackRouter.get("/product/:productID", getProductFeedback);
feedbackRouter.get("/product/:productID/stats", getFeedbackStats);
feedbackRouter.post("/:feedbackId/helpful", markAsHelpful);
feedbackRouter.post("/", verifyUser, submitFeedback);
feedbackRouter.delete("/:feedbackId", verifyUser, deleteFeedback);
feedbackRouter.get("/", verifyAdmin, getAllFeedback);
feedbackRouter.put("/:feedbackId/status", verifyAdmin, updateFeedbackStatus);

export default feedbackRouter;
