import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Middleware to verify JWT token
export function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Authorization: Bearer <token>
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Only allow admin
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access forbidden: admins only" });
        }

        req.user = decoded; // store decoded info in req.user
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
