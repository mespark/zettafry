import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendMail, mailConfigured } from "./mail.server";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(1000),
});

export const sendContactEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    if (!mailConfigured) {
      // Contact form still works via the Supabase insert; email is best-effort.
      return { emailed: false };
    }

    const to = process.env["CONTACT_INBOX_EMAIL"] || (process.env["GMAIL_USER"] as string);

    await sendMail({
      to,
      replyTo: data.email,
      subject: `New Zettafry contact form message from ${data.name}`,
      text: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        data.company ? `Company: ${data.company}` : null,
        "",
        data.message,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        ${data.company ? `<p><strong>Company:</strong> ${escapeHtml(data.company)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, "<br/>")}</p>
      `,
    });

    return { emailed: true };
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
