import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // Accept both 'Authorization' and 'authorization' headers
    let token = req.header("Authorization") || req.header("authorization");
    if (token && token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    }
    console.log("[AUTH] Received token:", token);
    console.log("[AUTH] Received token:", token);
    if (!token) {
      console.log("[AUTH] No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[AUTH] Decoded JWT:", decoded);
    } catch (jwtError) {
      console.log("[AUTH] JWT verification failed:", jwtError);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("[AUTH] No user found for token userId:", decoded.userId);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user) {
        req.userId = user._id;
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user context if token is invalid
    next();
  }
};
