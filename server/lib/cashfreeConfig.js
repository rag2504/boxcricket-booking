/**
 * Cashfree PG configuration from environment variables.
 *
 * Required: CASHFREE_APP_ID, CASHFREE_SECRET_KEY
 * Optional:
 *   CASHFREE_ENVIRONMENT = PRODUCTION | SANDBOX  (default: SANDBOX — safe for dev/test)
 *   CASHFREE_USE_MOCK = true                     (force mock payments)
 *   FRONTEND_URL, BACKEND_URL                    (redirects & webhooks)
 */

function normalizeEnvironment() {
  const raw = (
    process.env.CASHFREE_ENVIRONMENT ||
    process.env.CASHFREE_MODE ||
    ""
  )
    .toString()
    .trim()
    .toUpperCase();

  if (raw === "PRODUCTION" || raw === "LIVE") {
    return "production";
  }
  if (
    raw === "SANDBOX" ||
    raw === "TEST" ||
    raw === "DEVELOPMENT" ||
    raw === ""
  ) {
    return "sandbox";
  }
  return "sandbox";
}

export function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID?.trim() || "";
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim() || "";
  const environment = normalizeEnvironment();
  const isSandbox = environment === "sandbox";

  const credentialsMissing =
    !appId ||
    !secretKey ||
    appId === "TEST" ||
    secretKey === "TEST" ||
    appId === "your_app_id" ||
    secretKey === "your_secret_key";

  const useMock =
    process.env.CASHFREE_USE_MOCK === "true" ||
    (credentialsMissing && process.env.CASHFREE_USE_MOCK !== "false");

  const secretLooksProd = secretKey.includes("_ma_prod_");
  const secretLooksSandbox = secretKey.includes("_ma_test_");
  const envKeyMismatch =
    (isSandbox && secretLooksProd) || (!isSandbox && secretLooksSandbox);

  return {
    appId,
    secretKey,
    environment,
    isSandbox,
    useMock,
    credentialsMissing,
    envKeyMismatch,
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

export function logCashfreeConfig() {
  const cfg = getCashfreeConfig();
  console.log("💳 Cashfree configuration:");
  console.log(
    `   CASHFREE_ENVIRONMENT: ${cfg.environment.toUpperCase()} (SDK: ${cfg.isSandbox ? "SANDBOX" : "PRODUCTION"})`
  );
  console.log(`   App ID: ${cfg.appId ? `${cfg.appId.slice(0, 8)}...` : "NOT SET"}`);
  console.log(`   Secret: ${cfg.secretKey ? "SET" : "NOT SET"}`);
  console.log(`   Mode: ${cfg.useMock ? "MOCK" : "LIVE API"}`);
  console.log(`   Frontend URL: ${cfg.frontendUrl}`);
  console.log(`   Backend URL: ${cfg.backendUrl}`);
  if (cfg.envKeyMismatch) {
    console.warn(
      "   ⚠️ CASHFREE_ENVIRONMENT does not match secret key type (sandbox vs production). Orders will fail until aligned."
    );
  }
  if (cfg.useMock && !cfg.credentialsMissing) {
    console.log("   ⚠️ CASHFREE_USE_MOCK=true — real gateway disabled");
  }
  if (!cfg.useMock && !cfg.isSandbox) {
    console.log(
      "   ℹ️ Live mode: account must be KYC-activated in Cashfree dashboard for real charges."
    );
  }
}
