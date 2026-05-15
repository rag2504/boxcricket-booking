/**
 * Cashfree PG configuration from environment variables.
 *
 * Required: CASHFREE_APP_ID, CASHFREE_SECRET_KEY
 * Optional:
 *   CASHFREE_ENVIRONMENT = sandbox | production  (default: production)
 *   CASHFREE_USE_MOCK = true                     (force mock payments)
 *   FRONTEND_URL, BACKEND_URL                    (redirects & webhooks)
 */

function normalizeEnvironment() {
  const raw = (
    process.env.CASHFREE_ENVIRONMENT ||
    process.env.CASHFREE_MODE ||
    "production"
  )
    .toString()
    .trim()
    .toLowerCase();

  if (raw === "sandbox" || raw === "test" || raw === "development") {
    return "sandbox";
  }
  return "production";
}

export function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID?.trim() || "";
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim() || "";
  const environment = normalizeEnvironment();
  const isSandbox = environment === "sandbox";

  const credentialsMissing =
    !appId || !secretKey || appId === "TEST" || secretKey === "TEST";

  const useMock =
    process.env.CASHFREE_USE_MOCK === "true" || credentialsMissing;

  return {
    appId,
    secretKey,
    environment,
    isSandbox,
    useMock,
    credentialsMissing,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
    backendUrl:
      process.env.BACKEND_URL ||
      (process.env.VITE_API_URL || "").replace(/\/api\/?$/, "") ||
      `http://localhost:${process.env.PORT || 3001}`,
  };
}

export function logCashfreeConfig() {
  const cfg = getCashfreeConfig();
  console.log("💳 Cashfree configuration:");
  console.log(`   Environment: ${cfg.environment}${cfg.isSandbox ? " (sandbox)" : " (production)"}`);
  console.log(`   App ID: ${cfg.appId ? `${cfg.appId.slice(0, 8)}...` : "NOT SET"}`);
  console.log(`   Secret: ${cfg.secretKey ? "SET" : "NOT SET"}`);
  console.log(`   Mode: ${cfg.useMock ? "MOCK" : "LIVE"}`);
  console.log(`   Frontend URL: ${cfg.frontendUrl}`);
  console.log(`   Backend URL: ${cfg.backendUrl}`);
  if (cfg.useMock && !cfg.credentialsMissing) {
    console.log("   ⚠️ CASHFREE_USE_MOCK=true — real gateway disabled");
  }
}
