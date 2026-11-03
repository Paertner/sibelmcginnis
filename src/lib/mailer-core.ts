/** Talks to the Resend REST API. No site imports, so it can be tested with a mocked fetch. */
export type MailAttachment = {
  filename: string;
  /** Base64 file contents. */
  content: string;
  contentType: string;
  /** Makes the file an inline image: <img src="cid:..."> in the email. */
  contentId?: string;
};
export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  attachments?: MailAttachment[];
};
export type MailConfig = { key: string; from: string; base: string };
export type MailResult = { id?: string; error?: string };

const BATCH_SIZE = 100;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const payload = (config: MailConfig, message: MailMessage) => ({
  from: config.from,
  to: [message.to],
  subject: message.subject,
  html: message.html,
  text: message.text,
  ...(message.headers ? { headers: message.headers } : {}),
  ...(message.attachments?.length
    ? {
        attachments: message.attachments.map((file) => ({
          filename: file.filename,
          content: file.content,
          content_type: file.contentType,
          ...(file.contentId ? { content_id: file.contentId } : {}),
        })),
      }
    : {}),
});

type Answer = { ok: boolean; status: number; json: unknown };
async function post(
  config: MailConfig,
  path: string,
  body: unknown,
): Promise<Answer> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(`${config.base}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = await response.json().catch(() => null);
      // Resend allows a couple of requests a second: wait once and try again.
      if (response.status === 429 && attempt === 0) {
        await wait(1100);
        continue;
      }
      return { ok: response.ok, status: response.status, json };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        json: {
          message: `Could not reach the email service${error instanceof Error ? ` (${error.message})` : ""}.`,
        },
      };
    }
  }
}
/** Resend's own explanation, e.g. "The example.com domain is not verified". */
export function errorText(answer: Answer) {
  const json = answer.json as {
    message?: string;
    error?: { message?: string } | string;
  } | null;
  const message =
    json?.message ??
    (typeof json?.error === "string" ? json.error : json?.error?.message);
  return message || `The email service answered with status ${answer.status}.`;
}

/**
 * Sends the messages and returns one result per message, in the same order.
 * Plain messages go out in batches of 100; messages with attachments are sent
 * one by one because Resend's batch call does not accept attachments.
 */
export async function deliver(
  config: MailConfig,
  messages: MailMessage[],
  { pauseMs = 600 }: { pauseMs?: number } = {},
): Promise<MailResult[]> {
  const results: MailResult[] = new Array(messages.length);
  let requests = 0;
  const pause = async () => {
    if (requests++ > 0 && pauseMs) await wait(pauseMs);
  };
  const plain = messages.flatMap((message, index) =>
    message.attachments?.length ? [] : [index],
  );
  for (let start = 0; start < plain.length; start += BATCH_SIZE) {
    const chunk = plain.slice(start, start + BATCH_SIZE);
    await pause();
    const answer = await post(
      config,
      "/emails/batch",
      chunk.map((index) => payload(config, messages[index])),
    );
    const data = (answer.json as { data?: { id?: string }[] } | null)?.data;
    chunk.forEach((index, position) => {
      results[index] =
        answer.ok && data?.[position]?.id
          ? { id: data[position].id }
          : { error: errorText(answer) };
    });
  }
  for (const [index, message] of messages.entries()) {
    if (results[index]) continue;
    await pause();
    const answer = await post(config, "/emails", payload(config, message));
    const id = (answer.json as { id?: string } | null)?.id;
    results[index] = answer.ok && id ? { id } : { error: errorText(answer) };
  }
  return results;
}
