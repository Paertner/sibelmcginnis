import "server-only";
import { adminClient } from "./supabase";
import { getSecret } from "./secrets";
import { getStore } from "./store";
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
  const key = getSecret("resendApiKey");
  const sender = getStore().integrations?.resend;
  const from = sender?.fromEmail
    ? `${(sender.fromName || "Morning Coffee Community").replace(/[<>"]/g, "")} <${sender.fromEmail}>`
    : process.env.EMAIL_FROM;
  if (!key || !from) {
    console.error("[reset] email not sent: Resend key or sender is not set up.");
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [address],
        subject: "Set a new password",
        text: `Use this link to choose a new password for your Morning Coffee Community account:\n\n${link}\n\nThe link works once. If you did not ask for it, you can ignore this email.`,
      }),
    });
    if (!response.ok)
      console.error("[reset] Resend refused the email:", response.status);
    return response.ok;
  } catch (error) {
    console.error(
      "[reset] email request failed:",
      error instanceof Error ? error.message : "unknown",
    );
    return false;
  }
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
