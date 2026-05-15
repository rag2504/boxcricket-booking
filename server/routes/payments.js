import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import { getPaymentCallbackUrl } from "../lib/paymentUrls.js";
import { getRazorpayConfig, logRazorpayConfig } from "../lib/razorpayConfig.js";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  toPaise,
} from "../services/razorpayService.js";
import {
  confirmBookingAfterPayment,
  checkBookingSlotConflict,
} from "../lib/confirmBookingPayment.js";

logRazorpayConfig();

const router = express.Router();

/**
 * GET /api/payments/status/:bookingId
 */
router.get("/status/:bookingId", authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.userId,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const orderId =
      booking.payment?.razorpayOrderId;

    if (orderId && booking.payment?.status !== "completed") {
      try {
        const order = await fetchRazorpayOrder(orderId);
        if (order.status === "paid") {
          return res.json({
            success: true,
            status: "paid",
            razorpayOrderId: orderId,
            message: "Payment completed on Razorpay",
          });
        }
        return res.json({
          success: true,
          status: order.status,
          razorpayOrderId: orderId,
        });
      } catch (err) {
        console.warn("⚠️ Razorpay fetch failed:", err.message);
      }
    }

    return res.json({
      success: true,
      status: booking.payment?.status || booking.status,
      razorpayOrderId: orderId,
    });
  } catch (error) {
    console.error("GET /payments/status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/payments/create-order
 */
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId;

    console.log("💳 Razorpay create-order:", { bookingId, userId });

    if (!bookingId || bookingId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const cfg = getRazorpayConfig();
    if (cfg.credentialsMissing) {
      return res.status(400).json({
        success: false,
        code: "RAZORPAY_NOT_CONFIGURED",
        message:
          "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.",
      });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId }).populate(
      "groundId",
      "name location price features"
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const totalAmount = Number(booking.pricing?.totalAmount) || 0;
    if (totalAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Booking amount must be at least ₹1",
      });
    }

    const receipt = `bc_${booking._id}_${Date.now()}`.slice(0, 40);
    const order = await createRazorpayOrder({
      amountInr: totalAmount,
      receipt,
      notes: {
        bookingId: String(booking._id),
        bookingRef: booking.bookingId,
        userId: String(userId),
      },
    });

    booking.payment = {
      ...booking.payment,
      razorpayOrderId: order.id,
      status: "pending",
    };
    await booking.save();

    const amountPaise = toPaise(totalAmount);

    res.json({
      success: true,
      key: cfg.keyId,
      order: {
        id: order.id,
        amount: order.amount,
        amount_paise: amountPaise,
        currency: order.currency || "INR",
        receipt: order.receipt,
      },
      prefill: {
        name: booking.playerDetails?.contactPerson?.name || "",
        email: booking.playerDetails?.contactPerson?.email || "",
        contact: booking.playerDetails?.contactPerson?.phone || "",
      },
      callbackUrl: `${getPaymentCallbackUrl(booking._id)}`,
    });
  } catch (error) {
    console.error("❌ Razorpay create-order error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
});

/**
 * POST /api/payments/verify-payment
 * Body: bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature
 */
router.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.userId;

    console.log("💳 Razorpay verify-payment:", {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id
        ? `${String(razorpay_payment_id).slice(0, 12)}...`
        : undefined,
      userId,
    });

    if (!bookingId || bookingId === "undefined") {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details",
      });
    }

    const valid = verifyPaymentSignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!valid) {
      console.error("❌ Invalid Razorpay signature");
      return res.status(400).json({
        success: false,
        code: "INVALID_SIGNATURE",
        message: "Payment verification failed. Invalid signature.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId,
    }).populate("groundId", "name location price features");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (
      booking.payment?.razorpayOrderId &&
      booking.payment.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Order ID does not match this booking",
      });
    }

    if (booking.status === "confirmed" && booking.payment?.status === "completed") {
      return res.json({
        success: true,
        message: "Booking already confirmed",
        booking: booking.toObject(),
      });
    }

    let paymentDetails;
    try {
      paymentDetails = await fetchRazorpayPayment(razorpay_payment_id);
      if (paymentDetails.status !== "captured" && paymentDetails.status !== "authorized") {
        return res.status(400).json({
          success: false,
          message: `Payment not completed (status: ${paymentDetails.status})`,
          status: "failed",
        });
      }
    } catch (fetchErr) {
      console.error("❌ Razorpay payment fetch error:", fetchErr.message);
      return res.status(400).json({
        success: false,
        message: "Could not verify payment with Razorpay",
      });
    }

    const hasConflict = await checkBookingSlotConflict(booking);
    if (hasConflict) {
      booking.payment = {
        ...booking.payment,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: "refunded",
        paidAt: new Date(),
        paymentDetails,
      };
      booking.status = "cancelled";
      booking.cancellation = {
        cancelledBy: "system",
        cancelledAt: new Date(),
        reason: "Slot no longer available after payment",
      };
      await booking.save();
      return res.status(409).json({
        success: false,
        message:
          "This slot was booked by someone else. Contact support for a refund.",
        requiresRefund: true,
        booking: booking.toObject(),
      });
    }

    await confirmBookingAfterPayment(booking, {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentDetails,
    });

    res.json({
      success: true,
      message: "Payment verified and booking confirmed!",
      booking: booking.toObject(),
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
});

/**
 * POST /api/payments/payment-failed
 */
router.post("/payment-failed", authMiddleware, async (req, res) => {
  try {
    const { bookingId, order_id, error: paymentError } = req.body;
    const userId = req.userId;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    console.log("❌ Payment failed recorded:", { bookingId, order_id, paymentError });

    booking.payment = {
      ...booking.payment,
      razorpayOrderId: order_id || booking.payment?.razorpayOrderId,
      status: "failed",
    };
    booking.status = "cancelled";
    booking.cancellation = {
      cancelledBy: "system",
      cancelledAt: new Date(),
      reason: paymentError?.description || "Payment failed or cancelled",
    };

    await booking.save();

    res.json({
      success: true,
      message: "Payment failure recorded",
      booking: booking.toObject(),
    });
  } catch (error) {
    console.error("Payment failure handler error:", error);
    res.status(500).json({ success: false, message: "Failed to record payment failure" });
  }
});

export default router;
