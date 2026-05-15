import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function loadIfExists(filename, override = false) {
  const filePath = path.join(rootDir, filename);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override });
  }
}

// Base file, then environment-specific overrides.
// Production file uses override:false so Render/host env vars (e.g. RESEND_API_KEY) are not wiped.
loadIfExists(".env");
const nodeEnv = process.env.NODE_ENV || "development";
if (nodeEnv === "production") {
  loadIfExists(".env.production", false);
} else {
  loadIfExists(".env.development", true);
  if (!process.env.EMAIL_USER) {
    loadIfExists(".env.txt", true);
  }
}

/** Gmail app passwords are often copied with spaces; strip them for SMTP auth */
export function getEmailPassword() {
  return (process.env.EMAIL_PASS || "").replace(/\s/g, "");
}
