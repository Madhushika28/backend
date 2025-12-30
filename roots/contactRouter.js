import express from "express";
import { createMessage, getAllMessages } from "../controller/contactController.js";
import { verifyUser, verifyAdmin } from "../middleware/authMiddleware.js";

const contactRouter = express.Router();

// Public route
contactRouter.post("/", createMessage);

// Admin-only route
contactRouter.get("/", verifyUser, verifyAdmin, getAllMessages);

export default contactRouter;
