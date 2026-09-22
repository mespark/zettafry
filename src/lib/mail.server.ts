import nodemailer from "nodemailer";

/**
 * Sends email through Gmail SMTP using an App Password.
 * Server-only — GMAIL_USER / GMAIL_APP_PASSWORD must never be exposed to the browser
 * (do not prefix them with VITE_).
 *
 * Setup:
 * 1. Enable 2-Step Verification on the Gmail account.
 * 2. Create an App Password: https://myaccount.google.com/apppasswords
 * 3. Set GMAIL_USER=you@gmail.com and GMAIL_APP_PASSWORD=<the 16-char app password>.
 */

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const user = process.env["GMAIL_USER"];
  const pass = process.env["GMAIL_APP_PASSWORD"];
  if (!user || !pass) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export const mailConfigured = Boolean(process.env["GMAIL_USER"] && process.env["GMAIL_APP_PASSWORD"]);

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const t = getTransporter();
  if (!t) throw new Error("Gmail SMTP not configured — set GMAIL_USER and GMAIL_APP_PASSWORD.");

  const from = process.env["GMAIL_USER"] as string;
  await t.sendMail({
    from: `"Zettafry" <${from}>`,
    to: opts.to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
