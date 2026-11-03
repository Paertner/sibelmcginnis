import "server-only";
import { adminClient } from "./supabase";
import { sendEmail } from "./mailer";
import { assertEmailQuota, recordEmails } from "./email-quota";
import { escapeHtml } from "./safe-html";
import { siteOrigin } from "./site-url";

/**
 * One-use link where a person sets a new password. Built from the hashed token so
 * the server can read it (Supabase's own link puts the tokens after a # that never
 * reaches the server). The token is used up when the new password is submitted,
 * not when the page is opened, so email scanners cannot burn it.
 */
export async function createResetLink(address: string) {
  const { data, error } = await adminClient().auth.admin.generateLink({
    type: "recovery",
    email: address,
  });
  const token = data?.properties?.hashed_token;
  if (error || !token) {
    console.error("[reset] could not create a link:", error?.code);
    return null;
  }
  return `${siteOrigin()}/reset-password?token_hash=${encodeURIComponent(token)}`;
}

/** Sends the reset email through Resend. Returns false (and logs) when it cannot. */
export async function sendResetEmail(address: string, link: string) {
  const text = `Use this link to choose a new password for your Morning Coffee Community account:

${link}

The link works once. If you did not ask for it, you can ignore this email.`;
  const { error } = await sendEmail({
    to: address,
    subject: "Set a new password",
    text,
    html: `<p>Use this link to choose a new password for your Morning Coffee Community account:</p><p><a href="${link}">Set a new password</a></p><p>The link works once. If you did not ask for it, you can ignore this email.</p>`,
  });
  if (error) console.error("[reset] email not sent:", error);
  return !error;
}

/** Emails a new member the link to set their first password, counts it and writes the email log. Returns an error text or null. */
export async function sendWelcomeEmail(
  member: { id: string; name: string; email: string },
  link: string,
  { existing = false }: { existing?: boolean } = {},
) {
  const intro = existing
    ? "Sibel’s team sent you a link to set your password for Morning Coffee Community."
    : "Sibel has added you to Morning Coffee Community.";
  const first = member.name.trim().split(/\s+/)[0] || "there";
  const subject = "Set your password for Morning Coffee Community";
  try {
    assertEmailQuota(1);
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Daily email limit reached.";
  }
  const { id, error } = await sendEmail({
    to: member.email,
    subject,
    text: `Hello ${first},

${intro} Use this link to set your password:

${link}

The link can be used once. If it stops working, choose "Forgot your password?" on the login page and we will send you a new one.

Warmly,
Sibel's team`,
    html: `<p>Hello ${escapeHtml(first)},</p><p>${intro} Use the button to set your password.</p><p><a href="${link}" style="display:inline-block;padding:12px 22px;background:#8b5e3c;color:#fff;border-radius:8px;text-decoration:none">Set my password</a></p><p>Or paste this link into your browser:<br><a href="${link}">${link}</a></p><p>The link can be used once. If it stops working, choose “Forgot your password?” on the login page and we will send you a new one.</p><p>Warmly,<br>Sibel’s team</p>`,
  });
  if (!error) recordEmails(1);
  const { error: logError } = await adminClient()
    .from("email_log")
    .insert({
      member_id: member.id,
      to_email: member.email,
      subject,
      resend_id: id ?? null,
      status: error ? "failed" : "sent",
      error: error ?? null,
    });
  if (logError)
    console.error("[email] could not write the log:", logError.message);
  return error ?? null;
}

const lastAsked = new Map<string, number>();
/** True when this address already asked less than a minute ago. */
export function askedRecently(address: string) {
  const now = Date.now();
  for (const [key, time] of lastAsked)
    if (now - time > 60000) lastAsked.delete(key);
  if (lastAsked.has(address)) return true;
  lastAsked.set(address, now);
  return false;
}
