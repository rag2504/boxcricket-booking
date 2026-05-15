import crypto from "crypto";
import Razorpay from "razorpay";
import { getRazorpayConfig } from "../lib/razorpayConfig.js";

let client = null;

export function getRazorpayClient() {
  const cfg = getRazorpayConfig();
  if (cfg.credentialsMissing) {
    throw new Error("Razorpay credentials not configured");
  }
  if (!client) {
    client = new Razorpay({
      key_id: cfg.keyId,
      key_secret: cfg.keySecret,
    });
    console.log("💳 Razorpay client initialized");
  }
  return client;
}

/** INR rupees → paise (integer) */
export function toPaise(amountInr) {
  const paise = Math.round(Number(amountInr) * 100);
  if (!paise || paise < 100) {
    throw new Error("Order amount must be at least ₹1");
  }
  return paise;
}

/**
 * Create Razorpay order for checkout.
 */
export async function createRazorpayOrder({ amountInr, receipt, notes = {} }) {
  const cfg = getRazorpayConfig();
  const razorpay = getRazorpayClient();
  const amount = toPaise(amountInr);

  const payload = {
    amount,
    currency: "INR",
    receipt: String(receipt).slice(0, 40),
    notes,
  };

  console.log("💳 Razorpay orders.create:", {
    amount,
    currency: payload.currency,
    receipt: payload.receipt,
  });

  const order = await razorpay.orders.create(payload);

  console.log("✅ Razorpay order created:", {
    id: order.id,
    amount: order.amount,
    status: order.status,
  });

  return order;
}

/**
 * Verify payment signature from Razorpay Checkout callback.
 */
export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const cfg = getRazorpayConfig();
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", cfg.keySecret)
    .update(body)
    .digest("hex");

  const valid = expected === razorpaySignature;
  console.log("💳 Razorpay signature verification:", valid ? "VALID" : "INVALID");
  return valid;
}

export async function fetchRazorpayOrder(orderId) {
  const razorpay = getRazorpayClient();
  console.log("💳 Razorpay orders.fetch:", orderId);
  const order = await razorpay.orders.fetch(orderId);
  console.log("💳 Razorpay order status:", {
    id: order.id,
    status: order.status,
    amount_paid: order.amount_paid,
  });
  return order;
}

export async function fetchRazorpayPayment(paymentId) {
  const razorpay = getRazorpayClient();
  const payment = await razorpay.payments.fetch(paymentId);
  return payment;
}
