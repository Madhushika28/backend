import express from "express";
import mongoose from "mongoose";
import userRouter from "./roots/userRouter.js";
import user from "./models/user.js";
import product from "./models/product.js";
import jwt from "jsonwebtoken";
import productRouter from "./roots/productRouter.js";
import cors from "cors";
import dotenv from "dotenv";
import orderRouter from "./roots/orderRouter.js";
import contactRouter from "./roots/contactRouter.js";

dotenv.config();

const app = express()
app.use(cors() )

app.use(express.json())


app.use(
    (req,res,next) => {

        let token = req.header("Authorization")

        if(token != null){
            token = token.replace("Bearer ","")
            console.log(token)
            jwt.verify(token, process.env.JWT_SECRET,
                (err, decoded)=>{
                   if(decoded == null){
                    res.json({
                        message: "Invalid token please login again"
                    })
                    return
                   }else{
                    req.user = decoded
                   }
                })
        }
        next()

    }
)

const connectionstring = process.env.MONGO_URI;
mongoose.connect(connectionstring).then(
    () => {
        console.log("Database connected successfully")
    }   
).catch(
    () => {
        console.log("Database connection failed")
    }   
)

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/contact", contactRouter);

app.listen(5000, 
    () => {
        console.log("Server is running on port 5000");
    }
)






