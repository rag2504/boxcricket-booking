import nodemailer from "nodemailer";
import { getEmailPassword } from "../config/env.js";

/**
 * Render (and many cloud hosts) block outbound SMTP ports 25/465/587 on free tiers.
 * Use RESEND_API_KEY or BREVO_API_KEY on production — HTTPS APIs are not blocked.
 */

export function isRenderHosted() {
  return process.env.RENDER === "true" || process.env.RENDER === "1";
}

function hasSmtpConfig() {
  return Boolean(
    process.env.EMAIL_HOST?.trim() &&
      process.env.EMAIL_USER?.trim() &&
      getEmailPassword()
  );
}

export function getEmailProvider() {
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (process.env.BREVO_API_KEY?.trim()) return "brevo";
  if (process.env.SENDGRID_API_KEY?.trim()) return "sendgrid";

  if (process.env.EMAIL_PROVIDER === "smtp" && hasSmtpConfig()) return "smtp";

  // Gmail SMTP works on localhost; Render free tier blocks ports 587/465
  if (hasSmtpConfig() && !isRenderHosted()) return "smtp";

  return "none";
}

function parseFromAddress() {
  const raw = process.env.EMAIL_FROM || process.env.EMAIL_USER || "BoxCric";
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "BoxCric", email: raw.trim() };
}

function formatFromHeader() {
  const { name, email } = parseFromAddress();
  return name && email.includes("@") ? `${name} <${email}>` : email;
}

async function sendViaResend({ to, subject, html, text }) {
  const from = process.env.RESEND_FROM || formatFromHeader();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text: text || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Resend API error ${response.status}`);
  }
  return { messageId: data.id, provider: "resend" };
}

async function sendViaBrevo({ to, subject, html, text }) {
  const { name, email } = parseFromAddress();
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name, email },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Brevo API error ${response.status}`);
  }
  return { messageId: data.messageId, provider: "brevo" };
}

async function sendViaSendGrid({ to, subject, html, text }) {
  const { name, email } = parseFromAddress();
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email, name },
      subject,
      content: [
        ...(text ? [{ type: "text/plain", value: text }] : []),
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `SendGrid API error ${response.status}`);
  }
  return { messageId: response.headers.get("x-message-id"), provider: "sendgrid" };
}

let smtpTransporter = null;

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  if (isRenderHosted()) {
    console.warn(
      "⚠️ SMTP is blocked on Render free tier. Set RESEND_API_KEY or BREVO_API_KEY in environment variables."
    );
    return null;
  }
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    return null;
  }

  smtpTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: getEmailPassword(),
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: true },
  });
  return smtpTransporter;
}

async function sendViaSmtp({ to, subject, html, text }) {
  const transport = getSmtpTransporter();
  if (!transport) {
    throw new Error("SMTP not configured or blocked on this host");
  }
  const info = await transport.sendMail({
    from: formatFromHeader(),
    to,
    subject,
    html,
    text,
  });
  return { messageId: info.messageId, provider: "smtp" };
}

/**
 * Send email using the best available provider for the current environment.
 */
export async function sendEmail({ to, subject, html, text }) {
  const provider = getEmailProvider();
  console.log(`📧 Sending via provider: ${provider} → ${to}`);

  switch (provider) {
    case "resend":
      return sendViaResend({ to, subject, html, text });
    case "brevo":
      return sendViaBrevo({ to, subject, html, text });
    case "sendgrid":
      return sendViaSendGrid({ to, subject, html, text });
    case "smtp":
      return sendViaSmtp({ to, subject, html, text });
    default:
      if (isRenderHosted()) {
        throw new Error(
          "Email not configured on Render. Add RESEND_API_KEY in Render Environment (https://resend.com). Gmail SMTP is blocked on free tier."
        );
      }
      throw new Error(
        "Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env or add RESEND_API_KEY."
      );
  }
}

export async function sendEmailWithRetry(options, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📧 Sending email attempt ${attempt}/${maxAttempts}...`);
      return await sendEmail(options);
    } catch (error) {
      lastError = error;
      console.error(
        `❌ Email sending error (attempt ${attempt}/${maxAttempts}):`,
        error.message || error
      );
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

export function logEmailConfig() {
  const provider = getEmailProvider();
  const onRender = isRenderHosted();
  console.log(`📧 Email provider: ${provider}${onRender ? " (Render)" : " (local)"}`);
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY?.trim() ? "SET" : "NOT SET"}`);
  console.log(`   Gmail SMTP: ${hasSmtpConfig() ? "configured" : "not configured"}`);
  if (onRender && provider === "none") {
    console.warn(
      "⚠️ Add RESEND_API_KEY in Render Dashboard → Environment. Free tier blocks Gmail SMTP."
    );
  }
}
