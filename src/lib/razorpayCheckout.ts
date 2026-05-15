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

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay checkout script"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay from CDN"));
    document.head.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout modal (CricBox branding).
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

  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
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
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          console.log("💳 Razorpay popup closed");
          onDismiss?.();
          reject(new Error("Payment cancelled"));
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
      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", (response: { error?: unknown }) => {
        console.error("❌ Razorpay payment.failed:", response);
        onFailure?.(response);
        reject(new Error("Payment failed"));
      });
      paymentObject.open();
    } catch (err) {
      reject(err);
    }
  });
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}
