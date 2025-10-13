import express from "express";
import mongoose from "mongoose";
import userRouter from "./roots/userRouter.js";
import user from "./models/user.js";
import product from "./models/product.js";
import jwt from "jsonwebtoken";
import productRouter from "./roots/productRouter.js";

const app = express()

app.use(express.json()) 

app.use(
    (req,res,next) => {

        let token = req.header("Authorization")

        if(token != null){
            token = token.replace("Bearer ","")
            console.log(token)
            jwt.verify(token,"jwt_secret",
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

const connectionstring = "mongodb+srv://admin:root2001@cluster0.mswbyfo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongoose.connect(connectionstring).then(
    () => {
        console.log("Database connected successfully")
    }   
).catch(
    () => {
        console.log("Database connection failed")
    }   
)

app.use("/users", userRouter);
app.use("/products", productRouter);

app.listen(5000, 
    () => {
        console.log("Server is running on port 5000");
    }
)






