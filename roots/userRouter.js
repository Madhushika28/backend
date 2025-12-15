import express from "express";
import { createUser, getUser, googleLogin, loginUser } from "../controller/userController.js";


const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser)
userRouter.get("/me", getUser)
userRouter.post("/google-login", googleLogin)

export default userRouter;


