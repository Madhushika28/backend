import express from "express";
import { createMessage, getAllMessages } from "../controller/contactController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const contactRouter = express.Router();

// Public route – anyone can submit a message
contactRouter.post("/", createMessage);

// Admin-only route – requires JWT token
contactRouter.get("/", verifyToken, getAllMessages);

export default contactRouter;
