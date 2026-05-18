const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface OpenRazorpayCheckoutParams {
  key: string;
  orderId: string;
  amountPaise: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onDismiss?: () => void;
  onFailure?: (error: unknown) => void;
}

type RazorpayInstance = {
  open: () => void;
  close?: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

function isRzpDebug(): boolean {
  try {
    return (
      Boolean(import.meta.env?.DEV) ||
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("RZP_DEBUG") === "1")
    );
  } catch {
    return Boolean(import.meta.env?.DEV);
  }
}

/** Call before opening checkout to log body / overlay state (enable with localStorage RZP_DEBUG=1 or dev build). */
export function logRazorpayPointerEnvironment(phase: string): void {
  if (!isRzpDebug() || typeof document === "undefined") return;

  const body = document.body;
  const b = getComputedStyle(body);
  const radixOverlays = document.querySelectorAll(
    "[data-radix-dialog-overlay][data-state='open']"
  ).length;

  console.info(`[RZP_DEBUG] ${phase}`, {
    bodyPointerEvents: b.pointerEvents,
    bodyOverflow: b.overflow,
    radixDialogOpenOverlays: radixOverlays,
    htmlHasPointerNone:
      typeof document.documentElement !== "undefined" &&
      getComputedStyle(document.documentElement).pointerEvents === "none",
  });
}

let scriptLoadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay must run in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const finishOk = () => {
      if (window.Razorpay) resolve();
      else reject(new Error("Razorpay script loaded but window.Razorpay is missing"));
    };

    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener("load", finishOk, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay checkout script")),
        { once: true }
      );
      queueMicrotask(() => {
        if (window.Razorpay) resolve();
      });
      // load may have fired before this listener was attached (SPA / cached script)
      setTimeout(() => {
        if (window.Razorpay) resolve();
      }, 0);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => finishOk();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay from CDN"));
    document.head.appendChild(script);
  }).finally(() => {
    scriptLoadPromise = null;
  });

  return scriptLoadPromise;
}

/** Preload checkout.js (safe to call from route/modal mount). */
export function preloadRazorpayScript(): Promise<void> {
  return loadRazorpayScript().catch(() => {});
}

let activeCheckout: RazorpayInstance | null = null;

function destroyActiveCheckout(reason: string): void {
  if (!activeCheckout) return;
  try {
    if (isRzpDebug()) {
      console.info("[RZP_DEBUG] destroyActiveCheckout:", reason);
    }
    activeCheckout.close?.();
  } catch (e) {
    if (isRzpDebug()) {
      console.warn("[RZP_DEBUG] active checkout close() failed:", e);
    }
  }
  activeCheckout = null;
}

/**
 * Open Razorpay Checkout modal (CricBox branding).
 * Closes any previous checkout instance first. Avoid stacking multiple modals.
 */
export async function openRazorpayCheckout(
  params: OpenRazorpayCheckoutParams
): Promise<void> {
  const {
    key,
    orderId,
    amountPaise,
    currency = "INR",
    name = "CricBox",
    description = "Box Cricket Booking Payment",
    image = "/logo.png",
    prefill,
    onSuccess,
    onDismiss,
    onFailure,
  } = params;

  if (!key?.trim() || !orderId?.trim()) {
    throw new Error("Invalid Razorpay checkout configuration");
  }

  if (!amountPaise || amountPaise < 100) {
    throw new Error("Invalid payment amount");
  }

  console.log("💳 Opening Razorpay checkout:", {
    orderId,
    amountPaise,
    name,
  });

  logRazorpayPointerEnvironment("before_script_load");

  await loadRazorpayScript();

  logRazorpayPointerEnvironment("after_script_load");

  destroyActiveCheckout("before_new_open");

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      if (activeCheckout) {
        activeCheckout = null;
      }
    };

    const options = {
      key,
      amount: amountPaise,
      currency,
      name,
      description,
      image,
      order_id: orderId,
      handler: async (response: RazorpaySuccessResponse) => {
        console.log("✅ Razorpay payment success:", {
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
        });
        try {
          await onSuccess(response);
          settled = true;
          cleanup();
          resolve();
        } catch (err) {
          cleanup();
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          console.log("💳 Razorpay popup closed");
          logRazorpayPointerEnvironment("ondismiss");
          cleanup();
          onDismiss?.();
          if (!settled) {
            reject(new Error("Payment cancelled"));
          }
        },
      },
      prefill: {
        name: prefill?.name || "",
        email: prefill?.email || "",
        contact: prefill?.contact || "",
      },
      theme: {
        color: "#16a34a",
      },
    };

    try {
      logRazorpayPointerEnvironment("before_open()");
      const paymentObject = new window.Razorpay(
        options
      ) as RazorpayInstance;
      activeCheckout = paymentObject;

      paymentObject.on("payment.failed", (response: { error?: unknown }) => {
        console.error("❌ Razorpay payment.failed:", response);
        onFailure?.(response);
        cleanup();
        if (!settled) {
          reject(new Error("Payment failed"));
        }
      });

      paymentObject.open();
      logRazorpayPointerEnvironment("after_open()");
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}
