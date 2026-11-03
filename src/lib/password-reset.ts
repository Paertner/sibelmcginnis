import "server-only";
import { adminClient } from "./supabase";
import { sendEmail } from "./mailer";
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
