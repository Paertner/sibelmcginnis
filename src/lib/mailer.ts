import "server-only";
import { getSecret } from "./secrets";
import { getStore } from "./store";
import {
  deliver,
  type MailConfig,
  type MailMessage,
  type MailResult,
} from "./mailer-core";

export type { MailMessage, MailResult } from "./mailer-core";

/** Key and sender from Settings (or the server environment). The API address can be redirected for tests. */
export function mailerConfig(): MailConfig | null {
  const key = getSecret("resendApiKey");
  const sender = getStore().integrations?.resend;
  const from = sender?.fromEmail
    ? `${(sender.fromName || "Morning Coffee Community").replace(/[<>"\r\n]/g, "")} <${sender.fromEmail}>`
    : process.env.EMAIL_FROM;
  if (!key || !from) return null;
  return {
    key,
    from,
    base: (process.env.RESEND_API_URL || "https://api.resend.com").replace(
      /\/$/,
      "",
    ),
  };
}
export const mailerConfigured = () => mailerConfig() !== null;

const NOT_SET_UP =
  "Email is not set up. Save the Resend key and the sender address in Settings first.";

export async function sendEmail(message: MailMessage): Promise<MailResult> {
  return (await sendBatch([message]))[0];
}
export async function sendBatch(
  messages: MailMessage[],
): Promise<MailResult[]> {
  const config = mailerConfig();
  if (!config) return messages.map(() => ({ error: NOT_SET_UP }));
  return deliver(config, messages);
}
