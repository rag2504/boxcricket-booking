/** Wait for Cashfree PG v3 SDK (loaded from index.html on production hosts) */
export function waitForCashfree(maxWaitMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Cashfree === "function") {
      resolve();
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (typeof window.Cashfree === "function") {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > maxWaitMs) {
        clearInterval(interval);
        reject(new Error("Cashfree payment SDK failed to load. Please refresh and try again."));
      }
    }, 100);
  });
}

export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: "production" | "sandbox" = "production"
): Promise<void> {
  if (!paymentSessionId || paymentSessionId.startsWith("mock_")) {
    throw new Error("Invalid payment session");
  }

  await waitForCashfree();

  const cashfree = window.Cashfree({
    mode: mode === "sandbox" ? "sandbox" : "production",
  });

  const result = await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_self",
  });

  if (result?.error) {
    throw new Error(result.error.message || "Cashfree checkout failed");
  }
}

declare global {
  interface Window {
    Cashfree: (config: { mode: string }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: string;
      }) => Promise<{ error?: { message?: string } }>;
    };
  }
}
