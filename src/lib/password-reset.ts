import "server-only";
import { adminClient } from "./supabase";
import { sendBatch, sendEmail } from "./mailer";
import { assertEmailQuota, recordEmails } from "./email-quota";
import { siteOrigin } from "./site-url";
import { getStore } from "./store";
import { newsletterFooter } from "./email-templates";
import { buildSystemEmail, resolveSystemEmail } from "./system-emails";

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

/** The wording of an automatic email filled in for one person: the saved template, or the default. */
export function systemEmailFor(
  key: string,
  person: { name?: string; email: string },
  link: string,
) {
  const store = getStore();
  const template = resolveSystemEmail(key, store.systemEmails);
  return buildSystemEmail(
    template,
    store.emailFooter ?? newsletterFooter,
    { name: person.name, email: person.email, link },
    { origin: siteOrigin(), settings: store.siteSettings },
  );
}

/** Sends the reset email through Resend. Returns false (and logs) when it cannot. */
export async function sendResetEmail(
  person: { name?: string; email: string },
  link: string,
) {
  const mail = systemEmailFor("reset-password", person, link);
  const { error } = await sendEmail({ to: person.email, ...mail });
  if (error) console.error("[reset] email not sent:", error);
  return !error;
}

/** Emails a member the link to set their password, counts it and writes the email log. Returns an error text or null. */
export async function sendWelcomeEmail(
  member: { id: string; name: string; email: string },
  link: string,
) {
  const mail = systemEmailFor("set-password", member, link);
  try {
    assertEmailQuota(1);
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Daily email limit reached.";
  }
  const { id, error } = await sendEmail({ to: member.email, ...mail });
  if (!error) recordEmails(1);
  const { error: logError } = await adminClient()
    .from("email_log")
    .insert({
      member_id: member.id,
      to_email: member.email,
      subject: mail.subject,
      resend_id: id ?? null,
      status: error ? "failed" : "sent",
      error: error ?? null,
    });
  if (logError)
    console.error("[email] could not write the log:", logError.message);
  return error ?? null;
}

/** Emails many members their password link in batches, counts them and writes the email log. */
export async function sendWelcomeEmails(
  items: {
    member: { id: string; name: string; email: string };
    link: string;
  }[],
) {
  if (!items.length) return [];
  const mails = items.map(({ member, link }) => ({
    to: member.email,
    ...systemEmailFor("set-password", member, link),
  }));
  const results = await sendBatch(mails);
  recordEmails(results.filter((result) => !result.error).length);
  const { error } = await adminClient()
    .from("email_log")
    .insert(
      results.map((result, index) => ({
        member_id: items[index].member.id,
        to_email: items[index].member.email,
        subject: mails[index].subject,
        resend_id: result.id ?? null,
        status: result.error ? "failed" : "sent",
        error: result.error ?? null,
      })),
    );
  if (error) console.error("[email] could not write the log:", error.message);
  return results;
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
