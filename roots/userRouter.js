import express from "express";
import { createUser, getUser, loginUser } from "../controller/userController.js";


const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser)
userRouter.get("/me", getUser)

export default userRouter;


