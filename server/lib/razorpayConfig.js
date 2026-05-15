/**
 * Razorpay configuration from environment variables.
 *
 * Required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 * Optional: FRONTEND_URL, BACKEND_URL
 */

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const credentialsMissing =
    !keyId ||
    !keySecret ||
    keyId === "your_razorpay_key_id" ||
    keySecret === "your_razorpay_key_secret";

  const isTestMode = keyId.startsWith("rzp_test_");

  return {
    keyId,
    keySecret,
    credentialsMissing,
    isTestMode,
    frontendUrl: (process.env.FRONTEND_URL || "http://localhost:8080").replace(
      /\/$/,
      ""
    ),
    backendUrl: (
      process.env.BACKEND_URL ||
      (process.env.VITE_API_URL || "").replace(/\/api\/?$/, "") ||
      `http://localhost:${process.env.PORT || 3001}`
    ).replace(/\/$/, ""),
  };
}

export function logRazorpayConfig() {
  const cfg = getRazorpayConfig();
  console.log("💳 Razorpay configuration:");
  console.log(`   Key ID: ${cfg.keyId ? `${cfg.keyId.slice(0, 12)}...` : "NOT SET"}`);
  console.log(`   Secret: ${cfg.keySecret ? "SET" : "NOT SET"}`);
  console.log(`   Mode: ${cfg.credentialsMissing ? "NOT CONFIGURED" : cfg.isTestMode ? "TEST" : "LIVE"}`);
  console.log(`   Frontend URL: ${cfg.frontendUrl}`);
  console.log(`   Backend URL: ${cfg.backendUrl}`);
}
