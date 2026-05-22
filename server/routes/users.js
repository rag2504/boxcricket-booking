import express from "express";
import User from "../models/User.js";
import Ground from "../models/Ground.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// --- ADMIN ROUTER ---
// Minimal admin router exposing user listing for admin panel
const adminRouter = express.Router();
import Booking from "../models/Booking.js";

adminRouter.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const totalGrounds = await Ground.countDocuments();
    
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
    
    // Revenue calculation
    const allBookings = await Booking.find({ status: { $in: ["confirmed", "completed"] } });
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyBookings = await Booking.find({ 
      status: { $in: ["confirmed", "completed"] },
      createdAt: { $gte: startOfMonth }
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .populate("groundId", "name location");

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalGrounds,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue,
        monthlyRevenue,
        recentBookings,
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

import fetch from 'node-fetch';

adminRouter.get("/ai-insights", async (req, res) => {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.json({ success: true, insights: "AI insights are currently unavailable because the API key is not configured." });
    }

    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const allBookings = await Booking.find({ status: { $in: ["confirmed", "completed"] } });
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

    const prompt = `You are an AI business analyst for CricBox, a premium box cricket booking platform.
    Analyze these key metrics and provide a brief, professional, and actionable 2-paragraph executive summary for the admin dashboard.
    
    Data:
    - Total Users: ${totalUsers}
    - Total Bookings: ${totalBookings}
    - Total Revenue: INR ${totalRevenue}
    
    Focus on business growth and user engagement. Do not include greetings. Use Markdown for emphasis.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      })
    });

    if (!response.ok) throw new Error("Failed to fetch from Groq");
    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || "No insights could be generated.";

    res.json({ success: true, insights });
  } catch (error) {
    console.error("AI Insights error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI insights" });
  }
});

// List users with pagination and optional search
adminRouter.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email phone role isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, location, preferences } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// Add ground to favorites
router.post("/favorites/:groundId", authMiddleware, async (req, res) => {
  try {
    const { groundId } = req.params;

    // Check if ground exists
    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({
        success: false,
        message: "Ground not found",
      });
    }

    const user = await User.findById(req.userId);

    // Check if already in favorites
    if (user.favoriteGrounds.includes(groundId)) {
      return res.status(400).json({
        success: false,
        message: "Ground already in favorites",
      });
    }

    user.favoriteGrounds.push(groundId);
    await user.save();

    res.json({
      success: true,
      message: "Ground added to favorites",
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add to favorites",
    });
  }
});

// Remove ground from favorites
router.delete("/favorites/:groundId", authMiddleware, async (req, res) => {
  try {
    const { groundId } = req.params;

    const user = await User.findById(req.userId);
    user.favoriteGrounds = user.favoriteGrounds.filter(
      (id) => id.toString() !== groundId,
    );

    await user.save();

    res.json({
      success: true,
      message: "Ground removed from favorites",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove from favorites",
    });
  }
});

// Get user's favorite grounds
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "favoriteGrounds",
      select: "name location price rating images features",
    });

    res.json({
      success: true,
      favorites: user.favoriteGrounds,
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
    });
  }
});

// Update notification preferences
router.put("/preferences/notifications", authMiddleware, async (req, res) => {
  try {
    const { email, push, sms, marketing } = req.body;

    const user = await User.findById(req.userId);
    user.preferences.notifications = {
      email: email ?? user.preferences.notifications.email,
      push: push ?? user.preferences.notifications.push,
      sms: sms ?? user.preferences.notifications.sms,
      marketing: marketing ?? user.preferences.notifications.marketing,
    };

    await user.save();

    res.json({
      success: true,
      message: "Notification preferences updated",
      preferences: user.preferences.notifications,
    });
  } catch (error) {
    console.error("Update notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification preferences",
    });
  }
});

// Get user dashboard data
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("bookings")
      .populate("favoriteGrounds", "name location");

    // Get recent bookings
    const recentBookings = await user.populate({
      path: "bookings",
      options: { sort: { createdAt: -1 }, limit: 5 },
      populate: { path: "groundId", select: "name location" },
    });

    // Calculate user stats
    const totalBookings = user.bookings.length;
    const completedBookings = user.bookings.filter(
      (b) => b.status === "completed",
    ).length;

    res.json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          email: user.email,
          joinDate: user.createdAt,
          totalBookings: user.totalBookings,
          favoriteGrounds: user.favoriteGrounds.length,
        },
        stats: {
          totalBookings,
          completedBookings,
          successRate:
            totalBookings > 0
              ? Math.round((completedBookings / totalBookings) * 100)
              : 0,
        },
        recentBookings: recentBookings.bookings.slice(0, 5),
        favoriteGrounds: user.favoriteGrounds.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
});

// Change password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.userId);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
});

// Delete user account
router.delete("/account", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account",
      });
    }

    const user = await User.findById(req.userId);

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // Check for active bookings
    const activeBookings = user.bookings.filter(
      (booking) => booking.status === "confirmed",
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete account with active bookings",
      });
    }

    // Soft delete - mark as inactive instead of deleting
    user.status = "deleted";
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
});

export default router;
export { adminRouter };
