/**
 * Central CORS allowlist for Express + Socket.IO.
 *
 * Render (and most hosts) set NODE_ENV=production. Local Vite (e.g. :8080) must still
 * be allowed when you call the deployed API — use CORS_ORIGINS / CORS_ALLOW_LOCALHOST.
 */

function parseOriginList(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function defaultOrigins() {
  return [
    process.env.FRONTEND_URL,
    "https://boxcricket-booking.vercel.app",
    "https://boxcric.netlify.app",
    "https://box-host.netlify.app",
    "https://box-9t8s1yy3n-tanishs-projects-fa8014b4.vercel.app",
    "https://box-new.vercel.app",
    "https://box-cash.vercel.app",
    "https://box-junu.vercel.app",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:3000",
    "http://localhost:4000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
    "http://10.91.186.90:8080",
  ].filter(Boolean);
}

/**
 * @param {{ warn?: (msg: string) => void }} [opts]
 * @returns {(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void}
 */
export function createCorsOriginChecker(opts = {}) {
  const warn = opts.warn || ((msg) => console.warn(msg));

  const fromEnv = parseOriginList(process.env.CORS_ORIGINS || "");
  const allowSet = new Set([...defaultOrigins(), ...fromEnv]);

  const isVercelPreview = (o) =>
    /^https:\/\/[^/]+\.vercel\.app$/i.test(o);

  const isLocalhostOrigin = (origin) =>
    /^http:\/\/localhost(?::\d+)?$/i.test(origin) ||
    /^http:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin);

  return function corsOrigin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowSet.has(origin)) {
      return callback(null, true);
    }

    if (isVercelPreview(origin)) {
      return callback(null, true);
    }

    if (process.env.CORS_ALLOW_LOCALHOST !== "false" && isLocalhostOrigin(origin)) {
      return callback(null, true);
    }

    warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  };
}

export function logCorsStartup() {
  const fromEnv = parseOriginList(process.env.CORS_ORIGINS || "");
  console.log("[CORS] CORS_ORIGINS extra:", fromEnv.length ? fromEnv : "(none)");
  console.log(
    "[CORS] localhost / 127.0.0.1:",
    process.env.CORS_ALLOW_LOCALHOST === "false" ? "disabled" : "allowed (set CORS_ALLOW_LOCALHOST=false to disable)"
  );
  console.log("[CORS] FRONTEND_URL:", process.env.FRONTEND_URL || "(unset)");
}
