/** Frontend base URL for payment return redirects (no trailing slash) */
export function getFrontendBaseUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:8080").replace(/\/$/, "");
}

/** Backend base URL for webhooks (no trailing slash) */
export function getBackendBaseUrl() {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, "");
  }
  const apiUrl = process.env.VITE_API_URL || process.env.API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, "");
  }
  const port = process.env.PORT || 3001;
  return `http://localhost:${port}`;
}

export function getPaymentCallbackUrl(bookingId) {
  return `${getFrontendBaseUrl()}/payment/callback?booking_id=${bookingId}`;
}

export function getPaymentWebhookUrl() {
  return `${getBackendBaseUrl()}/api/payments/webhook`;
}
