import { Cashfree, CFEnvironment } from "cashfree-pg";
import { getCashfreeConfig } from "../lib/cashfreeConfig.js";

let client = null;

export function getCashfreeClient() {
  const cfg = getCashfreeConfig();
  if (cfg.useMock) return null;

  if (!client) {
    client = new Cashfree(
      cfg.isSandbox ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
      cfg.appId,
      cfg.secretKey
    );
  }
  return client;
}

/** Normalize phone for Cashfree (10-digit Indian mobile) */
export function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return "9999999999";
}

/** Normalize email for Cashfree */
export function normalizeEmail(email, fallback = "customer@boxcric.com") {
  const e = String(email || "").trim();
  return e.includes("@") ? e : fallback;
}

/**
 * Create Cashfree PG order — returns payment_session_id for frontend checkout SDK.
 */
export async function createCashfreeOrder({
  orderId,
  amount,
  customerId,
  customerName,
  customerPhone,
  customerEmail,
  returnUrl,
  notifyUrl,
}) {
  const cf = getCashfreeClient();
  if (!cf) {
    throw new Error("Cashfree client not initialized");
  }

  const orderAmount = Number(Number(amount).toFixed(2));
  if (!orderAmount || orderAmount < 1) {
    throw new Error("Order amount must be at least ₹1");
  }

  const orderData = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: "INR",
    customer_details: {
      customer_id: String(customerId),
      customer_name: customerName || "Customer",
      customer_phone: normalizePhone(customerPhone),
      customer_email: normalizeEmail(customerEmail),
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl,
      payment_methods: "cc,dc,nb,upi,paylater,emi",
    },
  };

  console.log("💳 Cashfree PGCreateOrder:", {
    order_id: orderData.order_id,
    order_amount: orderData.order_amount,
    return_url: returnUrl,
  });

  const response = await cf.PGCreateOrder(orderData);
  const data = response?.data;

  if (!data?.order_id || !data?.payment_session_id) {
    console.error("❌ Invalid Cashfree create order response:", data);
    throw new Error(
      "Cashfree did not return order_id or payment_session_id"
    );
  }

  console.log("✅ Cashfree order created:", {
    order_id: data.order_id,
    payment_session_id: data.payment_session_id?.slice(0, 20) + "...",
    order_status: data.order_status,
  });

  return data;
}

export async function fetchCashfreeOrder(orderId) {
  const cf = getCashfreeClient();
  if (!cf) throw new Error("Cashfree client not initialized");
  const response = await cf.PGFetchOrder(orderId);
  return response?.data;
}
