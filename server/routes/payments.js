

import express from "express";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Ground from "../models/Ground.js";
import NotificationService from "../services/notificationService.js";
import {
  getPaymentCallbackUrl,
  getPaymentWebhookUrl,
} from "../lib/paymentUrls.js";
import { getCashfreeConfig, logCashfreeConfig } from "../lib/cashfreeConfig.js";
import {
  createCashfreeOrder,
  fetchCashfreeOrder,
  isCashfreeActivationError,
  isCashfreeAuthError,
} from "../services/cashfreeService.js";

logCashfreeConfig();

const cashfreeCfg = () => getCashfreeConfig();

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
        const paymentDetails = await fetchCashfreeOrder(booking.payment.cashfreeOrderId);
        const order_status = paymentDetails.order_status;

        // Auto-fix: If payment is PAID but booking is still pending, update it
        if (order_status === 'PAID' && booking.status === 'pending') {
          console.log(`🔧 Auto-fixing booking ${bookingId}: Payment is PAID but booking is pending`);

          booking.payment.status = "completed";
          booking.payment.paidAt = new Date();
          booking.payment.paymentDetails = paymentDetails;
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
          booking.payment.paymentDetails = paymentDetails;
          
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
        const paymentDetails = await fetchCashfreeOrder(order_id);
        const order_status = paymentDetails.order_status;
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
    const cfg = cashfreeCfg();
    if (cfg.useMock) {
      return res.status(400).json({
        success: false,
        message: "Cashfree credentials not configured or CASHFREE_USE_MOCK=true",
      });
    }

    const data = await createCashfreeOrder({
      orderId: `test_${Date.now()}`,
      amount: 1,
      customerId: "test_customer",
      customerName: "Test Customer",
      customerPhone: "9999999999",
      customerEmail: "test@boxcric.com",
      returnUrl: `${cfg.frontendUrl}/payment/callback?booking_id=test`,
      notifyUrl: getPaymentWebhookUrl(),
    });

    res.json({
      success: true,
      message: "Cashfree connection successful",
      appId: `${cfg.appId.slice(0, 8)}...`,
      mode: cfg.environment,
      testOrderId: data.order_id,
      paymentSessionId: data.payment_session_id,
    });
  } catch (error) {
    console.error("Cashfree test failed:", error);
    res.status(500).json({
      success: false,
      message: "Cashfree connection failed",
      error: error.message,
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

    const totalAmount = Number(booking.pricing?.totalAmount) || 0;
    console.log("Amount calculation (INR):", totalAmount);

    if (totalAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Booking amount must be at least ₹1",
      });
    }

    const cfg = cashfreeCfg();
    const returnUrl = `${getPaymentCallbackUrl(booking._id)}&order_id={order_id}`;
    const notifyUrl = getPaymentWebhookUrl();

    // Mock only when credentials missing or CASHFREE_USE_MOCK=true (NOT because NODE_ENV=development)
    if (cfg.useMock) {
      console.log("🧪 Mock payment order (CASHFREE_USE_MOCK or missing credentials)");

      const mockOrderId = `mock_order_${booking._id}_${Date.now()}`;
      const mockPaymentSessionId = `mock_session_${Date.now()}`;

      booking.payment = {
        ...booking.payment,
        cashfreeOrderId: mockOrderId,
        status: "pending",
      };
      await booking.save();

      const mockPaymentUrl = `${getPaymentCallbackUrl(booking._id)}&order_id=${mockOrderId}&order_status=PAID&mock=true`;

      return res.json({
        success: true,
        order: {
          id: mockOrderId,
          amount: totalAmount,
          currency: "INR",
          payment_session_id: mockPaymentSessionId,
          order_status: "ACTIVE",
          payment_url: mockPaymentUrl,
        },
        appId: "MOCK_APP_ID",
        mode: "mock",
        mock: true,
      });
    }

    let order;
    try {
      order = await createCashfreeOrder({
        orderId: `order_${booking._id}_${Date.now()}`,
        amount: totalAmount,
        customerId: userId,
        customerName: booking.playerDetails?.contactPerson?.name,
        customerPhone: booking.playerDetails?.contactPerson?.phone,
        customerEmail: booking.playerDetails?.contactPerson?.email,
        returnUrl,
        notifyUrl,
      });
    } catch (sdkError) {
      const errBody = sdkError.response?.data || sdkError;
      const errorMessage =
        errBody?.message || sdkError.message || "Failed to create Cashfree order";
      const httpStatus = sdkError.response?.status;
      console.error("❌ Cashfree SDK error:", errBody);

      if (sdkError.code === "CASHFREE_ENV_MISMATCH") {
        return res.status(400).json({
          success: false,
          code: "CASHFREE_ENV_MISMATCH",
          message: sdkError.message,
        });
      }

      if (isCashfreeActivationError(errorMessage)) {
        const cfg = cashfreeCfg();
        return res.status(400).json({
          success: false,
          code: "CASHFREE_NOT_ACTIVATED",
          message:
            "Cashfree account is not activated for transactions. Complete KYC or use Sandbox credentials with CASHFREE_ENVIRONMENT=SANDBOX.",
          environment: cfg.environment,
        });
      }

      if (isCashfreeAuthError(httpStatus, errorMessage)) {
        return res.status(400).json({
          success: false,
          code: "CASHFREE_AUTH_FAILED",
          message:
            "Cashfree authentication failed. Verify CASHFREE_APP_ID and CASHFREE_SECRET_KEY match CASHFREE_ENVIRONMENT (SANDBOX vs PRODUCTION).",
        });
      }

      throw new Error(errorMessage);
    }

    booking.payment = {
      ...booking.payment,
      cashfreeOrderId: order.order_id,
      cashfreePaymentSessionId: order.payment_session_id,
      status: "pending",
    };
    await booking.save();

    res.json({
      success: true,
      order: {
        id: order.order_id,
        amount: order.order_amount,
        currency: order.order_currency,
        payment_session_id: order.payment_session_id,
        order_status: order.order_status,
        payment_url: null,
      },
      appId: cfg.appId,
      mode: cfg.environment,
      mock: false,
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
      mock
    } = req.body;

    const userId = req.userId;
    console.log("🔍 Payment verification request:", { order_id, payment_session_id, bookingId, userId, mock });

    if (!bookingId || bookingId === "undefined") {
      console.log("❌ Invalid booking ID:", bookingId);
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    // Handle mock payment verification for development
    if (mock === true || order_id?.startsWith("mock_")) {
      console.log("🧪 Development mode: Mock payment verification");
      
      // Find the booking in MongoDB
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

      // Update booking with mock payment details
      booking.payment = {
        ...booking.payment,
        cashfreeOrderId: order_id || `mock_order_${Date.now()}`,
        cashfreePaymentSessionId: payment_session_id || `mock_session_${Date.now()}`,
        status: "completed",
        paidAt: new Date(),
        paymentDetails: {
          order_status: 'PAID',
          order_amount: booking.pricing?.totalAmount || 500,
          payment_method: 'MOCK_PAYMENT'
        }
      };
      
      booking.status = "confirmed";
      booking.confirmation = {
        confirmedAt: new Date(),
        confirmationCode: `BC${Date.now().toString().slice(-6)}`,
        confirmedBy: "mock_payment"
      };

      await booking.save();
      console.log("✅ Mock payment verified! Booking confirmed:", booking.bookingId);

      return res.json({
        success: true,
        message: "Mock payment verified and booking confirmed!",
        booking: booking.toObject(),
        mock: true
      });
    }

    // Verify payment with Cashfree using SDK
    let paymentDetails;
    try {
      console.log("🔍 Verifying payment with Cashfree for order:", order_id);
      paymentDetails = await fetchCashfreeOrder(order_id);
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
        
        // Send booking receipt email after payment confirmation (non-blocking)
        sendBookingReceiptEmail(bookingForEmail, user).then(emailResult => {
          console.log(`📧 Receipt email result:`, emailResult.success ? 'SUCCESS' : `FAILED - ${emailResult.message}`);
        }).catch(emailError => {
          console.error("❌ Failed to send receipt email:", emailError.message);
        });
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
          
          // Send receipt email if payment was successful (non-blocking)
          sendBookingReceiptEmail(bookingForEmail, user).then(emailResult => {
            console.log(`📧 Webhook: Receipt email result:`, emailResult.success ? 'SUCCESS' : `FAILED - ${emailResult.message}`);
          }).catch(emailError => {
            console.error("❌ Webhook: Failed to send receipt email:", emailError.message);
          });
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