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
import paymentRouter from "./roots/paymentRouter.js";

dotenv.config();

const app = express();

// ✅ CORS - Update with your actual frontend URL
app.use(cors({
  origin: true, // Allows all origins (for testing)
  credentials: true
}));

app.use(express.json());

// ✅ AUTH MIDDLEWARE (FIXED)
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Don't block request, just log error
            console.log("Token verification failed:", error.message);
        }
    }
    next();
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Cristal Beauty API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ ROOT ROUTE
app.get('/', (req, res) => {
  res.json({
    message: '🎀 Cristal Beauty E-commerce API',
    version: '1.0.0',
    status: 'active',
    endpoints: [
      'GET /health',
      'GET /api/products',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/users/me',
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/payments',
      'POST /api/contact',
      'GET /api/feedback'
    ]
  });
});

// ✅ DATABASE CONNECTION
const connectionstring = process.env.MONGO_URI;
mongoose.connect(connectionstring)
  .then(() => console.log("✅ Database connected successfully"))
  .catch(error => {
    console.log("❌ Database connection failed:", error.message);
    process.exit(1);
  });

// ✅ ALL API ROUTES
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/contact", contactRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/payments", paymentRouter);

// ✅ SIMPLE 404 HANDLER (NO WILDCARD)
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    available: 'Visit / for all endpoints'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});