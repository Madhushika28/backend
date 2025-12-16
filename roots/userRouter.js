import express from "express";
import { blockOrUnblockUser, createUser, getAllUsers, getUser, googleLogin, loginUser } from "../controller/userController.js";


const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser)
userRouter.get("/me", getUser)
userRouter.post("/google-login", googleLogin)
userRouter.get("/all-users", getAllUsers)
userRouter.put("/block/:email", blockOrUnblockUser)

export default userRouter;


