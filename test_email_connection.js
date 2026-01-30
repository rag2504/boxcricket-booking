
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const result = dotenv.config();

if (result.error) {
    console.log("❌ Error loading .env file:", result.error);
}

console.log("Checking email configuration...");

const host = process.env.EMAIL_HOST || "";
const port = process.env.EMAIL_PORT || "";
const user = process.env.EMAIL_USER || "";
const pass = process.env.EMAIL_PASS || "";

console.log(`EMAIL_HOST: '${host}'`);
console.log(`EMAIL_PORT: '${port}'`);
console.log(`EMAIL_USER: '${user}'`);

// Check logic
let hasError = false;

if (user.trim() !== user) {
    console.log("❌ WARNING: EMAIL_USER has leading/trailing whitespace!");
    hasError = true;
}

console.log(`EMAIL_PASS length (raw): ${pass.length}`);
if (pass.replace(/\s/g, '').length === 16) {
    console.log("ℹ️  Pass seems to be an App Password (16 chars).");
} else {
    console.log(`⚠️  Pass length is ${pass.length}. Normal passwords?`);
}

const createTransporter = () => {
    if (!host || !port || !user || !pass) {
        console.log("⚠️ Email configuration incomplete.");
        return null;
    }

    // FORCE STRIP SPACES FOR TESTING
    const cleanPass = pass.replace(/\s/g, '');

    try {
        const transport = nodemailer.createTransport({
            host: host.trim(),
            port: Number(port),
            secure: Number(port) === 465,
            auth: {
                user: user.trim(),
                pass: cleanPass,
            },
            connectionTimeout: 10000,
            debug: false,
            logger: false
        });
        return transport;
    } catch (error) {
        console.error("❌ Failed to create transport object:", error);
        return null;
    }
};

const verifyConnection = async () => {
    const transporter = createTransporter();
    if (!transporter) {
        return;
    }

    console.log("Attempting to verify connection WITH SPACES REMOVED...");
    try {
        await transporter.verify();
        console.log("✅ Email connection verified successfully!");
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        if (error.responseCode) console.log("Response Code:", error.responseCode);
    }
};

verifyConnection();
