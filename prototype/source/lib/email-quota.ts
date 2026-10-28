import { getStore } from "./store";
import { today } from "./dates";

/** Resend's free tier allows 100 emails a day; the admin can raise it in Settings. */
export const DEFAULT_DAILY_EMAIL_LIMIT = 100;

/** Emails sent today (UTC day) against the daily limit. */
export function emailQuota() {
  const data = getStore();
  const limit =
    data.integrations?.resend?.dailyLimit ?? DEFAULT_DAILY_EMAIL_LIMIT;
  const sent = data.emailUsage?.date === today() ? data.emailUsage.sent : 0;
  return { limit, sent, left: Math.max(0, limit - sent) };
}
export type EmailQuota = ReturnType<typeof emailQuota>;

/** Stops a send that would go over today's limit. */
export function assertEmailQuota(recipients: number) {
  const { limit, left } = emailQuota();
  if (recipients > left)
    throw new Error(
      `This email would go to ${recipients} ${recipients === 1 ? "person" : "people"}, but only ${left} of today’s ${limit} emails are left. Choose fewer recipients or send the rest tomorrow.`,
    );
}

export function recordEmails(count: number) {
  const data = getStore();
  data.emailUsage = { date: today(), sent: emailQuota().sent + count };
}
