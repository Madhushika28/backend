import jwt from "jsonwebtoken";
import User from "../models/user.js";


export const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token required",
        code: "TOKEN_REQUIRED",
      });
    }

    const token = authHeader.split(" ")[1];

   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.email) {
      return res.status(401).json({
        message: "Invalid token payload",
        code: "INVALID_PAYLOAD",
      });
    }

    const user = await User.findOne({ email: decoded.email }).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check blocked status
    if (user.isBlock) {
      return res.status(403).json({
        message: "Account is blocked",
        code: "ACCOUNT_BLOCKED",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }
};


export const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
      code: "ADMIN_REQUIRED",
    });
  }
  next();
};


export const verifyCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({
      message: "Customer access required",
      code: "CUSTOMER_REQUIRED",
    });
  }
  next();
};
