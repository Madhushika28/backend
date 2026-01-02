import express from "express";
import mongoose from "mongoose";
import userRouter from "./roots/userRouter.js";
import jwt from "jsonwebtoken";
import productRouter from "./roots/productRouter.js";
import cors from "cors";
import dotenv from "dotenv";
import orderRouter from "./roots/orderRouter.js";
import contactRouter from "./roots/contactRouter.js";
import feedbackRouter from "./roots/feedbackRouter.js";
import paymentRouter from "./roots/paymentRouter.js"; // Make sure this is imported!

dotenv.config();

const app = express();

// ✅ FIXED CORS
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend-domain.com'],
  credentials: true
}));

app.use(express.json());

// ✅ FIXED AUTH MIDDLEWARE
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            console.log("Invalid token:", error.message);
            // Don't block - just continue without user
        }
    }
    next();
});

// ✅ ADD BACK THESE ROUTES:
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

// ✅ IMPORTANT: Connect to database BEFORE routes
const connectionstring = process.env.MONGO_URI;
mongoose.connect(connectionstring).then(
    () => {
        console.log("✅ Database connected successfully");
    }   
).catch(
    (error) => {
        console.log("❌ Database connection failed:", error.message);
    }   
);

// ✅ MOUNT ALL YOUR ROUTES
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/contact", contactRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/payments", paymentRouter); // Don't forget this!

// ✅ ADD 404 HANDLER FOR UNKNOWN API ROUTES
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        message: 'API endpoint not found',
        path: req.originalUrl 
    });
});

// ✅ CATCH ALL ROUTE
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        available: ['/', '/health', '/api/products', '/api/users', '/api/orders', '/api/payments']
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});