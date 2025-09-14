

import express from "express";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Ground from "../models/Ground.js";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import NotificationService from "../services/notificationService.js";

// NOTE: For development, we use placeholder HTTPS URLs since Cashfree requires HTTPS
// In production, these will be your actual domain URLs

// Cashfree credentials
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_URL = process.env.CASHFREE_API_URL || "https://api.cashfree.com/pg"; // Production API
const CASHFREE_SANDBOX_URL = "https://sandbox.cashfree.com/pg"; // Sandbox API
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_TEST_MODE = process.env.CASHFREE_MODE === 'test';

// Use sandbox mode only if explicitly set to test mode
const USE_SANDBOX = IS_TEST_MODE;

// Initialize Cashfree SDK
const cashfree = new Cashfree(
  USE_SANDBOX ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
  CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY
);

// Validate credentials
if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
  console.error("❌ Cashfree credentials not found in environment variables!");
  console.error("   Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY for payment processing");
}

const router = express.Router();

/**
 * Public endpoint to fetch payment status from Cashfree if booking is not found
 * GET /api/payments/status/:bookingId
 * Returns: { success, status, message, order_status, cashfreeOrderId }
 */
router.get("/status/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ success: false, message: "No bookingId provided" });

    // Try to find booking in DB
    const booking = await Booking.findById(bookingId);
    if (booking && booking.payment && booking.payment.cashfreeOrderId) {
      // Try to fetch latest status from Cashfree
      try {
        const response = await cashfree.PGFetchOrder(booking.payment.cashfreeOrderId);
        const order_status = response.data.order_status;

        // Auto-fix: If payment is PAID but booking is still pending, update it
        if (order_status === 'PAID' && booking.status === 'pending') {
          console.log(`🔧 Auto-fixing booking ${bookingId}: Payment is PAID but booking is pending`);

          booking.payment.status = "completed";
          booking.payment.paidAt = new Date();
          booking.payment.paymentDetails = response.data;
          booking.status = "confirmed";
          booking.confirmation = {
            confirmedAt: new Date(),
            confirmationCode: `BC${Date.now().toString().slice(-6)}`,
            confirmedBy: "auto_fix"
          };

          await booking.save();
          console.log(`✅ Auto-fixed booking ${bookingId} - now confirmed`);
        }

        // Auto-fix: If payment is PAID but payment status is pending (even if booking is confirmed)
        if (order_status === 'PAID' && booking.payment.status === 'pending') {
          console.log(`🔧 Auto-fixing payment status for booking ${bookingId}: Payment is PAID but status is pending`);
          
          booking.payment.status = "completed";
          booking.payment.paidAt = booking.payment.paidAt || new Date();
          booking.payment.paymentDetails = response.data;
          
          // Ensure booking is confirmed if payment is successful
          if (booking.status !== 'confirmed') {
            booking.status = "confirmed";
            booking.confirmation = {
              confirmedAt: new Date(),
              confirmationCode: `BC${Date.now().toString().slice(-6)}`,
              confirmedBy: "auto_fix"
            };
          }

          await booking.save();
          console.log(`✅ Auto-fixed payment status for booking ${bookingId}`);
          
          // Send receipt email if it wasn't sent before
          try {
            const User = (await import('../models/User.js')).default;
            const { sendBookingReceiptEmail } = await import('../services/emailService.js');
            const Ground = (await import('../models/Ground.js')).default;
            const { fallbackGrounds } = await import('../data/fallbackGrounds.js');
            
            const user = await User.findById(booking.userId);
            if (user && user.email) {
              console.log(`📧 Auto-fix: Sending receipt email to: ${user.email}`);
              
              // Populate ground details for the email
              let bookingForEmail = booking.toObject();
              const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(bookingForEmail.groundId);
              
              if (isValidObjectId) {
                try {
                  const mongoGround = await Ground.findById(bookingForEmail.groundId);
                  if (mongoGround) {
                    bookingForEmail.groundId = mongoGround.toObject();
                    console.log(`✅ Auto-fix: Populated MongoDB ground: ${mongoGround.name}`);
                  } else {
                    const fallbackGround = fallbackGrounds.find(g => g._id === bookingForEmail.groundId);
                    if (fallbackGround) {
                      bookingForEmail.groundId = fallbackGround;
                      console.log(`✅ Auto-fix: Populated fallback ground: ${fallbackGround.name}`);
                    }
                  }
                } catch (groundError) {
                  console.error('Auto-fix: Error finding ground:', groundError);
                }
              } else {
                const fallbackGround = fallbackGrounds.find(g => g._id === bookingForEmail.groundId);
                if (fallbackGround) {
                  bookingForEmail.groundId = fallbackGround;
                  console.log(`✅ Auto-fix: Populated fallback ground: ${fallbackGround.name}`);
                }
              }
              
              const emailResult = await sendBookingReceiptEmail(bookingForEmail, user);
              console.log(`📧 Auto-fix: Receipt email result:`, emailResult.success ? 'SUCCESS' : 'FAILED');
            }
          } catch (emailError) {
            console.error("❌ Auto-fix: Failed to send receipt email:", emailError.message);
          }
        }

        return res.json({
          success: true,
          status: order_status,
          message: `Fetched from Cashfree for booking ${bookingId}`,
          order_status,
          cashfreeOrderId: booking.payment.cashfreeOrderId
        });
      } catch (err) {
        // If Cashfree fails, fallback to DB status
        return res.json({
          success: true,
          status: booking.payment.status || booking.status,
          message: "Fetched from DB (Cashfree fetch failed)",
          cashfreeOrderId: booking.payment.cashfreeOrderId
        });
      }
    }
    // If booking not found, try to find by cashfree order id (if passed as query)
    const { order_id } = req.query;
    if (order_id) {
      try {
        const response = await cashfree.PGFetchOrder(order_id);
        const order_status = response.data.order_status;
        return res.json({
          success: true,
          status: order_status,
          message: `Fetched from Cashfree for order_id ${order_id}`,
          order_status,
          cashfreeOrderId: order_id
        });
      } catch (err) {
        return res.status(404).json({ success: false, message: "Order not found in Cashfree" });
      }

    }
    return res.status(404).json({ success: false, message: "Booking not found" });
  } catch (error) {
    console.error("/payments/status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// (Removed duplicate imports and variable declarations here)

// Test Cashfree connection
router.get("/test-cashfree", async (req, res) => {
  try {
    console.log("Testing Cashfree connection...");
    console.log("Keys:", { 
      appId: CASHFREE_APP_ID ? "Present" : "Missing",
      secretKey: CASHFREE_SECRET_KEY ? "Present" : "Missing"
    });
    
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        message: "Cashfree credentials not configured",
        error: "Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in environment variables"
      });
    }
    
    try {
      // Test with Cashfree SDK
      const testOrderData = {
        order_id: `test_${Date.now()}`,
        order_amount: 100,
        order_currency: "INR",
        customer_details: {
          customer_id: "test_customer",
          customer_name: "Test Customer",
          customer_phone: "9999999999",
          customer_email: "test@example.com"
        },
        order_meta: {
          return_url: "https://example.com/return",
          notify_url: "https://example.com/webhook"
        }
      };

      const response = await cashfree.PGCreateOrder(testOrderData);
      console.log("Cashfree connection successful - test order created:", response.data.order_id);
      
      res.json({
        success: true,
        message: "Cashfree connection successful",
        appId: CASHFREE_APP_ID.substring(0, 8) + "...",
        mode: USE_SANDBOX ? "sandbox" : "production",
        testOrderId: response.data.order_id,
        paymentSessionId: response.data.payment_session_id
      });
    } catch (sdkError) {
      console.error("Cashfree SDK error:", sdkError.response?.data || sdkError);
      throw new Error(`Cashfree SDK error: ${sdkError.response?.data?.message || sdkError.message}`);
    }
  } catch (error) {
    console.error("Cashfree test failed:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: "Cashfree connection failed",
      error: error.message
    });
  }
});

/**
 * Create a Cashfree order
 */
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId;
    
    console.log("Payment order creation request:", { bookingId, userId });
    
    if (!bookingId || bookingId === "undefined") {
      console.log("Invalid booking ID:", bookingId);
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    // Find the booking in MongoDB
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      userId 
    }).populate("groundId", "name location price features");

    console.log("Booking found:", !!booking);
    if (booking) {
      console.log("Booking details:", {
        bookingId: booking.bookingId,
        status: booking.status,
        pricing: booking.pricing,
        groundId: booking.groundId
      });
    }

    if (!booking) {
      console.error("Booking not found for bookingId:", bookingId);
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    // Calculate amount in paise (Cashfree needs amount in smallest unit)
    const totalAmount = booking.pricing?.totalAmount || 500;
    const amountPaise = Math.round(totalAmount * 100);

    console.log("Amount calculation:", { totalAmount, amountPaise });

    if (!amountPaise || amountPaise < 100) {
      console.error("Invalid amount (must be >= 100 paise):", amountPaise);
      return res.status(400).json({ 
        success: false, 
        message: "Booking amount must be at least ₹1" 
      });
    }

    // Create Cashfree order using SDK
    const orderData = {
      order_id: `order_${booking._id}_${Date.now()}`,
      order_amount: totalAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId.toString(),
        customer_name: booking.playerDetails?.contactPerson?.name || "Customer",
        customer_phone: booking.playerDetails?.contactPerson?.phone || "",
        customer_email: booking.playerDetails?.contactPerson?.email || "customer@example.com"
      },
      order_meta: {
        // Always use your real frontend and backend URLs for redirect and webhook
        return_url: `https://box-junu.vercel.app/payment/callback?booking_id=${booking._id}`,
  notify_url: `https://box-junu.onrender.com/api/payments/webhook`,
        payment_methods: "cc,dc,nb,upi,paylater,emi"
      }
    };

    console.log("Creating Cashfree order with:", orderData);
    console.log("Test mode:", USE_SANDBOX);

    // Check if credentials are available
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error("Cashfree credentials not configured!");
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured. Please contact support."
      });
    }
    
    let response;
    try {
      response = await cashfree.PGCreateOrder(orderData);
      console.log("Cashfree order created successfully:", response.data.order_id);
    } catch (sdkError) {
      console.error("Cashfree SDK error:", sdkError.response?.data || sdkError);
      
      // Handle authentication errors specifically
      if (sdkError.response?.status === 401 || sdkError.response?.status === 403) {
        throw new Error("Cashfree authentication failed. Please check API credentials.");
      }
      
      throw new Error(sdkError.response?.data?.message || sdkError.message || "Failed to create Cashfree order");
    }

    // Extract order data from SDK response
    const order = response.data;
    console.log("Cashfree order created:", order.order_id);
    console.log("Full Cashfree response:", JSON.stringify(order, null, 2));

    // Validate required fields from Cashfree response
    if (!order.order_id || !order.payment_session_id) {
      console.error("Invalid Cashfree response - missing required fields:", order);
      throw new Error("Invalid response from Cashfree - missing order_id or payment_session_id");
    }

    // Update booking with payment order details
    booking.payment = {
      ...booking.payment,
      cashfreeOrderId: order.order_id,
      status: "pending"
    };
    await booking.save();

    console.log("Booking updated with payment details");

    // Generate payment URL
    const paymentUrl = order.payment_link || (USE_SANDBOX 
      ? `https://sandbox.cashfree.com/pg/view/${order.payment_session_id}`
      : `https://payments.cashfree.com/pg/view/${order.payment_session_id}`);

    console.log("Generated payment URL:", paymentUrl);

    res.json({
      success: true,
      order: {
        id: order.order_id,
        amount: order.order_amount,
        currency: order.order_currency,
        payment_session_id: order.payment_session_id,
        order_status: order.order_status,
        payment_url: paymentUrl,
      },
      appId: CASHFREE_APP_ID,
      mode: USE_SANDBOX ? "sandbox" : "production"
    });
  } catch (error) {
    console.error('Cashfree order creation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to create Cashfree order." 
    });
  }
});

/**
 * Verify Cashfree payment and mark booking as confirmed
 */
router.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const {
      order_id,
      payment_session_id,
      bookingId,
    } = req.body;

    const userId = req.userId;
    console.log("🔍 Payment verification request:", { order_id, payment_session_id, bookingId, userId });

    if (!bookingId || bookingId === "undefined") {
      console.log("❌ Invalid booking ID:", bookingId);
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    // Verify payment with Cashfree using SDK
    let paymentDetails;
    try {
      console.log("🔍 Verifying payment with Cashfree for order:", order_id);
      const response = await cashfree.PGFetchOrder(order_id);
      paymentDetails = response.data;
      console.log("✅ Payment verification successful:", paymentDetails.order_status);
      console.log("📋 Payment details:", JSON.stringify(paymentDetails, null, 2));
    } catch (sdkError) {
      console.error("❌ Cashfree verification error:", sdkError.response?.data || sdkError);
      throw new Error(`Failed to verify payment with Cashfree: ${sdkError.response?.data?.message || sdkError.message}`);
    }
    
    // Check if payment is successful
    if (paymentDetails.order_status === 'PAID') {
      // Payment is successful, proceed with booking confirmation
    } else if (paymentDetails.order_status === 'ACTIVE') {
      // Payment is still pending
      return res.status(200).json({
        success: false,
        message: "Payment pending",
        status: "pending"
      });
    } else if (paymentDetails.order_status === 'EXPIRED' || paymentDetails.order_status === 'FAILED') {
      return res.status(400).json({
        success: false,
        message: `Payment ${paymentDetails.order_status.toLowerCase()}`,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // Find the booking in MongoDB
    console.log("🔍 Looking for booking:", bookingId, "for user:", userId);
    const booking = await Booking.findOne({
      _id: bookingId,
      userId
    }).populate("groundId", "name location price features");

    if (!booking) {
      console.log("❌ Booking not found:", bookingId);
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log("✅ Found booking:", booking.bookingId, "current status:", booking.status);

    // Check if booking is still available before confirming
    // This prevents race conditions where slot gets booked by someone else
    // while this user was completing payment
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(booking.groundId._id || booking.groundId);
    
    if (isValidObjectId) {
      // Check for any overlapping confirmed bookings created after this booking
      const overlappingBookings = await Booking.find({
        groundId: booking.groundId._id || booking.groundId,
        bookingDate: booking.bookingDate,
        status: "confirmed",
        _id: { $ne: booking._id }, // Exclude current booking
        createdAt: { $gte: booking.createdAt } // Only check bookings created after this one
      });

      // Check for time slot overlaps
      const start = new Date(`2000-01-01 ${booking.timeSlot.startTime}`);
      const end = new Date(`2000-01-01 ${booking.timeSlot.endTime}`);
      
      const hasOverlap = overlappingBookings.some(existingBooking => {
        const bookingStart = new Date(`2000-01-01 ${existingBooking.timeSlot.startTime}`);
        const bookingEnd = new Date(`2000-01-01 ${existingBooking.timeSlot.endTime}`);
        return start < bookingEnd && end > bookingStart;
      });

      if (hasOverlap) {
        // Slot is no longer available, cancel this booking and initiate refund
        booking.payment = {
          cashfreeOrderId: order_id,
          cashfreePaymentSessionId: payment_session_id,
          status: "refunded",
          paidAt: new Date(),
          paymentDetails: paymentDetails
        };
        booking.status = "cancelled";
        booking.cancellation = {
          cancelledBy: "system",
          cancelledAt: new Date(),
          reason: "Slot no longer available - booking conflict detected after payment"
        };

        await booking.save();

        return res.status(409).json({
          success: false,
          message: "Sorry, this time slot has been booked by someone else. Your payment will be refunded.",
          booking: booking.toObject(),
          requiresRefund: true
        });
      }
    }

    // Update booking with payment details
    booking.payment = {
      ...booking.payment,
      cashfreeOrderId: order_id,
      cashfreePaymentSessionId: payment_session_id,
      status: "completed",
      paidAt: new Date(),
      paymentDetails: paymentDetails
    };
    console.log("💳 Updated payment details:", booking.payment);
    booking.status = "confirmed";
    booking.confirmation = {
      confirmedAt: new Date(),
      confirmationCode: `BC${Date.now().toString().slice(-6)}`,
      confirmedBy: "system"
    };

    await booking.save();
    console.log("✅ Booking saved successfully! Status:", booking.status, "Confirmation code:", booking.confirmation?.confirmationCode);

    // Create booking confirmed notification
    try {
      const groundName = booking.groundId?.name || (booking.groundId && booking.groundId.name) || 'Unknown Ground';
      const bookingData = {
        bookingId: booking.bookingId,
        groundName,
        groundId: booking.groundId?._id || booking.groundId,
        date: booking.bookingDate.toISOString().split('T')[0],
        timeSlot: `${booking.timeSlot.startTime}-${booking.timeSlot.endTime}`,
        amount: booking.pricing?.totalAmount
      };
      
      await NotificationService.createBookingNotification(booking.userId, bookingData, 'booking_confirmed');
      console.log(`📢 Created confirmed booking notification for booking: ${booking.bookingId}`);
    } catch (notificationError) {
      console.error('❌ Failed to create confirmed booking notification:', notificationError);
      // Don't fail the payment verification if notification fails
    }

    // Send booking receipt email after payment confirmation
    try {
      // Get user details for email
      const User = (await import('../models/User.js')).default;
      const { sendBookingReceiptEmail } = await import('../services/emailService.js');
      const Ground = (await import('../models/Ground.js')).default;
      const { fallbackGrounds } = await import('../data/fallbackGrounds.js');
      
      const user = await User.findById(booking.userId);
      if (user && user.email) {
        console.log(`📧 Sending receipt email to: ${user.email}`);
        
        // Populate ground details for the email
        let bookingForEmail = booking.toObject();
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(bookingForEmail.groundId);
        
        if (isValidObjectId) {
          try {
            const mongoGround = await Ground.findById(bookingForEmail.groundId);
            if (mongoGround) {
              bookingForEmail.groundId = mongoGround.toObject();
              console.log(`✅ Populated MongoDB ground: ${mongoGround.name}`);
            } else {
              const fallbackGround = fallbackGrounds.find(g => g._id === bookingForEmail.groundId);
              if (fallbackGround) {
                bookingForEmail.groundId = fallbackGround;
                console.log(`✅ Populated fallback ground: ${fallbackGround.name}`);
              }
            }
          } catch (groundError) {
            console.error('Error finding ground:', groundError);
          }
        } else {
          const fallbackGround = fallbackGrounds.find(g => g._id === bookingForEmail.groundId);
          if (fallbackGround) {
            bookingForEmail.groundId = fallbackGround;
            console.log(`✅ Populated fallback ground: ${fallbackGround.name}`);
          }
        }
        
        const emailResult = await sendBookingReceiptEmail(bookingForEmail, user);
        console.log(`📧 Receipt email result:`, emailResult.success ? 'SUCCESS' : `FAILED - ${emailResult.message}`);
        
        if (!emailResult.success) {
          console.error(`❌ Email failed for booking ${booking.bookingId}:`, emailResult.error);
          // Log the failure but don't fail the payment verification
        }
      } else {
        console.error(`❌ No user or email found for booking ${booking.bookingId}`);
      }
    } catch (emailError) {
      // Don't fail the payment verification if email fails
      console.error("❌ Failed to send receipt email:", emailError.message);
      console.error("❌ Email error stack:", emailError.stack);
    }

    res.json({
      success: true,
      message: "Payment verified and booking confirmed!",
      booking: booking.toObject(),
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
});

/**
 * Handle payment failure
 */
router.post("/payment-failed", authMiddleware, async (req, res) => {
  try {
    const { bookingId, order_id, error } = req.body;
    const userId = req.userId;
    if (!bookingId || bookingId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      userId 
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.payment = {
      ...booking.payment,
      cashfreeOrderId: order_id,
      status: "failed"
    };
    booking.status = "cancelled";
    booking.cancellation = {
      cancelledBy: "system",
      cancelledAt: new Date(),
      reason: "Payment failed"
    };

    await booking.save();

    res.json({
      success: true,
      message: "Payment failure recorded",
      booking: booking.toObject(),
    });
  } catch (error) {
    console.error("Payment failure handling error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment failure",
    });
  }
});

/**
 * Webhook handler for Cashfree payment notifications
 */
router.post("/webhook", async (req, res) => {
  try {
    const { order_id, order_amount, order_currency, order_status, payment_session_id } = req.body;

    console.log("🔔 Cashfree webhook received:", { order_id, order_status, order_amount });
    console.log("📋 Full webhook payload:", JSON.stringify(req.body, null, 2));
    
    // Find booking by order_id
    const booking = await Booking.findOne({ 
      "payment.cashfreeOrderId": order_id 
    });
    
    if (!booking) {
      console.error("❌ Webhook: Booking not found for order_id:", order_id);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    console.log("✅ Webhook: Found booking:", booking.bookingId, "current status:", booking.status);
    
    if (order_status === 'PAID') {
      booking.payment.status = "completed";
      booking.payment.paidAt = new Date();
      booking.status = "confirmed";
      booking.confirmation = {
        confirmedAt: new Date(),
        confirmationCode: `BC${Date.now().toString().slice(-6)}`,
        confirmedBy: "system"
      };
    } else if (['EXPIRED', 'FAILED', 'CANCELLED', 'TERMINATED', 'USER_DROPPED'].includes(order_status)) {
      booking.payment.status = "failed";
      booking.status = "cancelled";
      booking.cancellation = {
        cancelledBy: "system",
        cancelledAt: new Date(),
        reason: `Payment ${order_status.toLowerCase()}`
      };
    }
    
    await booking.save();
    console.log("✅ Webhook: Booking updated successfully:", booking.bookingId, "new status:", booking.status);

    // Send receipt email if payment was successful
    if (order_status === 'PAID') {
      try {
        // Get user details for email
        const User = (await import('../models/User.js')).default;
        const { sendBookingReceiptEmail } = await import('../services/emailService.js');
        const Ground = (await import('../models/Ground.js')).default;
        const { fallbackGrounds } = await import('../data/fallbackGrounds.js');
        
        const user = await User.findById(booking.userId);
        if (user && user.email) {
          console.log(`📧 Webhook: Sending receipt email to: ${user.email}`);
          
          // Populate ground details for the email
          let bookingForEmail = booking.toObject();
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(bookingForEmail.groundId);
          
          if (isValidObjectId) {
            try {
              const mongoGround = await Ground.findById(bookingForEmail.groundId);
              if (mongoGround) {
                bookingForEmail.groundId = mongoGround.toObject();
                console.log(`✅ Webhook: Populated MongoDB ground: ${mongoGround.name}`);
              } else {
                const fallbackGround = fallbackGrounds.find(g => g._id === bookingForEmail.groundId);
                if (fallbackGround) {
                  bookingForEmail.groundId = fallbackGround;
                  console.log(`✅ Webhook: Populated fallback ground: ${fallbackGround.name}`);
                }
              }
            } catch (groundError) {
              console.error('Webhook: Error finding ground:', groundError);
            }
          } else {
            const fallbackGround = fallbackGrounds.find(g => g._id === bookingForEmail.groundId);
            if (fallbackGround) {
              bookingForEmail.groundId = fallbackGround;
              console.log(`✅ Webhook: Populated fallback ground: ${fallbackGround.name}`);
            }
          }
          
          const emailResult = await sendBookingReceiptEmail(bookingForEmail, user);
          console.log(`📧 Webhook: Receipt email result:`, emailResult.success ? 'SUCCESS' : `FAILED - ${emailResult.message}`);
          
          if (!emailResult.success) {
            console.error(`❌ Webhook: Email failed for booking ${booking.bookingId}:`, emailResult.error);
            // Log the failure but don't fail the webhook
          }
        } else {
          console.error(`❌ Webhook: No user or email found for booking ${booking.bookingId}`);
        }
      } catch (emailError) {
        // Don't fail the webhook if email fails
        console.error("❌ Webhook: Failed to send receipt email:", emailError.message);
        console.error("❌ Webhook: Email error stack:", emailError.stack);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
});

export default router;