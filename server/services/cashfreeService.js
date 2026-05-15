import { Cashfree, CFEnvironment } from "cashfree-pg";
import { getCashfreeConfig } from "../lib/cashfreeConfig.js";

let client = null;
let clientEnv = null;

export function getCashfreeClient() {
  const cfg = getCashfreeConfig();
  if (cfg.useMock) return null;

  const sdkEnv = cfg.isSandbox ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;

  if (!client || clientEnv !== sdkEnv) {
    console.log(
      `💳 Initializing Cashfree SDK (${cfg.isSandbox ? "SANDBOX" : "PRODUCTION"})`
    );
    client = new Cashfree(sdkEnv, cfg.appId, cfg.secretKey);
    clientEnv = sdkEnv;
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
  const cfg = getCashfreeConfig();
  const cf = getCashfreeClient();
  if (!cf) {
    throw new Error("Cashfree client not initialized");
  }

  if (cfg.envKeyMismatch) {
    throw Object.assign(
      new Error(
        "CASHFREE_ENVIRONMENT does not match your API keys. Use SANDBOX with test keys or PRODUCTION with live keys."
      ),
      { code: "CASHFREE_ENV_MISMATCH" }
    );
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
    environment: cfg.environment,
    order_id: orderData.order_id,
    order_amount: orderData.order_amount,
    return_url: returnUrl,
    notify_url: notifyUrl,
  });

  const response = await cf.PGCreateOrder(orderData);
  const data = response?.data;

  console.log("💳 Cashfree PGCreateOrder response:", {
    order_id: data?.order_id,
    order_status: data?.order_status,
    has_payment_session_id: Boolean(data?.payment_session_id),
  });

  if (!data?.order_id || !data?.payment_session_id) {
    console.error("❌ Invalid Cashfree create order response:", data);
    throw new Error(
      "Cashfree did not return order_id or payment_session_id"
    );
  }

  console.log("✅ Cashfree order created:", {
    order_id: data.order_id,
    payment_session_id: `${data.payment_session_id.slice(0, 24)}...`,
    order_status: data.order_status,
  });

  return data;
}

export async function fetchCashfreeOrder(orderId) {
  const cf = getCashfreeClient();
  if (!cf) throw new Error("Cashfree client not initialized");
  console.log("💳 Cashfree PGFetchOrder:", orderId);
  const response = await cf.PGFetchOrder(orderId);
  const data = response?.data;
  console.log("💳 Cashfree order status:", {
    order_id: data?.order_id,
    order_status: data?.order_status,
  });
  return data;
}

/** Detect Cashfree account / activation errors from SDK or API */
export function isCashfreeActivationError(message) {
  const m = String(message || "").toLowerCase();
  return (
    m.includes("transactions are not enabled") ||
    m.includes("not activated") ||
    m.includes("complete kyc") ||
    m.includes("account is not activated")
  );
}

export function isCashfreeAuthError(status, message) {
  if (status === 401 || status === 403) return true;
  const m = String(message || "").toLowerCase();
  return m.includes("authentication") || m.includes("invalid app id");
}
