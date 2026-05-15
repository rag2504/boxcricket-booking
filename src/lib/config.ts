/**
 * Central API base URL — always prefer VITE_API_URL (set in Vercel/Netlify build env).
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    const devDefault = "http://localhost:3001/api";
    console.log("[API] VITE_API_URL not set — using dev default:", devDefault);
    return devDefault;
  }

  console.error(
    "[API] VITE_API_URL is not set for this production build. Set it in your hosting provider (e.g. Vercel)."
  );
  return "https://boxcricket-booking.onrender.com/api";
}

export const API_BASE_URL = getApiBaseUrl();
