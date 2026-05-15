const CASHFREE_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadCashfreeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Cashfree === "function") {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${CASHFREE_SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Cashfree SDK script"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Cashfree SDK from CDN"));
    document.head.appendChild(script);
  });
}

export function waitForCashfree(maxWaitMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const tryReady = () => typeof window.Cashfree === "function";

    if (tryReady()) {
      resolve();
      return;
    }

    loadCashfreeScript()
      .then(() => {
        const start = Date.now();
        const interval = setInterval(() => {
          if (tryReady()) {
            clearInterval(interval);
            resolve();
          } else if (Date.now() - start > maxWaitMs) {
            clearInterval(interval);
            reject(
              new Error(
                "Cashfree SDK loaded but Cashfree() is unavailable. Refresh and try again."
              )
            );
          }
        }, 100);
      })
      .catch(reject);
  });
}

export type CashfreeMode = "production" | "sandbox";

/** Resolve checkout mode: backend response > VITE_CASHFREE_MODE > production */
export function resolveCashfreeMode(
  backendMode?: string
): CashfreeMode {
  if (backendMode === "sandbox") return "sandbox";
  if (backendMode === "production") return "production";
  const viteMode = import.meta.env.VITE_CASHFREE_MODE;
  if (viteMode === "sandbox") return "sandbox";
  return "production";
}

/**
 * Open Cashfree PG checkout using payment_session_id from backend.
 */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: CashfreeMode = "production"
): Promise<void> {
  const sessionId = paymentSessionId?.trim();
  if (!sessionId || sessionId.startsWith("mock_")) {
    throw new Error("Invalid payment session ID from server");
  }

  const sdkMode = mode === "sandbox" ? "sandbox" : "production";
  console.log("💳 Opening Cashfree checkout:", {
    sessionPrefix: sessionId.slice(0, 24) + "...",
    mode: sdkMode,
  });

  await waitForCashfree();

  const cashfree = window.Cashfree({ mode: sdkMode });

  const checkoutOptions = {
    paymentSessionId: sessionId,
    redirectTarget: "_modal" as const,
  };

  console.log("💳 Cashfree checkout options:", {
    paymentSessionId: checkoutOptions.paymentSessionId.slice(0, 24) + "...",
    redirectTarget: checkoutOptions.redirectTarget,
    mode: sdkMode,
  });

  const result = await cashfree.checkout(checkoutOptions);

  if (result?.error) {
    console.error("Cashfree checkout error:", result.error);
    throw new Error(result.error.message || "Cashfree checkout failed");
  }

  console.log("✅ Cashfree checkout completed or redirected");
}

declare global {
  interface Window {
    Cashfree: (config: { mode: string }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_modal" | "_top";
      }) => Promise<{ error?: { message?: string } } | void>;
    };
  }
}
