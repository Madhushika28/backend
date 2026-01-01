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
import feedbackRouter from "./roots/feedbackRouter.js";
import paymentRouter from "./roots/paymentRouter.js";

dotenv.config();

const app = express()
app.use(cors() )

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cristal Beauty API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎀 Cristal Beauty E-commerce API',
    version: '1.0.0',
    status: 'active',
    documentation: {
      products: 'GET /api/products',
      users: 'POST /api/users/register, POST /api/users/login',
      orders: 'GET /api/orders, POST /api/orders',
      payments: 'GET /api/payments, POST /api/payments',
      contact: 'POST /api/contact'
    },
    health: 'GET /health'
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    success: true 
  });
});

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    api: 'Cristal Beauty API v1.0',
    endpoints: [
      { path: '/api/products', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/users', methods: ['POST', 'GET'] },
      { path: '/api/orders', methods: ['GET', 'POST', 'PUT'] },
      { path: '/api/payments', methods: ['GET', 'POST', 'PUT'] },
      { path: '/api/contact', methods: ['POST'] },
      { path: '/api/feedback', methods: ['GET', 'POST'] }
    ]
  });
});


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
app.use("/api/feedback", feedbackRouter);
app.use("/api/payments", paymentRouter);



const PORT = process.env.PORT || 5000;
app.listen(5000, 
    () => {
        console.log("Server is running on port 5000");
    }
)






