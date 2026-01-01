import express from "express";
import { createMessage, getAllMessages } from "../controller/contactController.js";
import { verifyUser, verifyAdmin } from "../middleware/authMiddleware.js";

const contactRouter = express.Router();
contactRouter.post("/", createMessage);
contactRouter.get("/", verifyUser, verifyAdmin, getAllMessages);

export default contactRouter;
