import { test, expect } from "@playwright/test";
import { deliver, type MailMessage } from "../src/lib/mailer-core";
import { readUnsubscribe, signUnsubscribe } from "../src/lib/unsubscribe-token";
import { wantsEmail, withUnsubscribed } from "../src/lib/email-preferences";

const config = {
  key: "re_test",
  from: "Test <a@example.test>",
  base: "http://resend.test",
};
const message = (n: number, extra: Partial<MailMessage> = {}): MailMessage => ({
  to: `m${n}@example.test`,
  subject: `Hello ${n}`,
  html: "<p>Hi</p>",
  text: "Hi",
  ...extra,
});

type Call = { url: string; body: unknown; auth: string | null };
function mockFetch(
  answer: (url: string, body: unknown) => { status: number; json: unknown },
) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    calls.push({
      url,
      body,
      auth: new Headers(init.headers).get("authorization"),
    });
    const { status, json } = answer(url, body);
    return new Response(JSON.stringify(json), { status });
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

test("plain emails go out in batches of 100 and keep their order", async () => {
  let counter = 0;
  const mock = mockFetch((_url, body) => ({
    status: 200,
    json: { data: (body as unknown[]).map(() => ({ id: `id-${++counter}` })) },
  }));
  try {
    const results = await deliver(
      config,
      Array.from({ length: 150 }, (_, i) => message(i)),
      { pauseMs: 0 },
    );
    expect(mock.calls.map((c) => c.url)).toEqual([
      "http://resend.test/emails/batch",
      "http://resend.test/emails/batch",
    ]);
    expect((mock.calls[0].body as unknown[]).length).toBe(100);
    expect((mock.calls[1].body as unknown[]).length).toBe(50);
    expect(mock.calls[0].auth).toBe("Bearer re_test");
    expect(results[0].id).toBe("id-1");
    expect(results[149].id).toBe("id-150");
  } finally {
    mock.restore();
  }
});

test("messages with inline images are sent one by one with content ids and headers", async () => {
  const mock = mockFetch((url) => ({
    status: 200,
    json: url.endsWith("/batch") ? { data: [{ id: "plain" }] } : { id: "abc" },
  }));
  try {
    const results = await deliver(
      config,
      [
        message(1, {
          headers: { "List-Unsubscribe": "<http://x.test/u>" },
          attachments: [
            {
              filename: "a.png",
              content: "AAAA",
              contentType: "image/png",
              contentId: "media-0",
            },
          ],
        }),
        message(2),
      ],
      { pauseMs: 0 },
    );
    expect(mock.calls.map((c) => c.url)).toEqual([
      "http://resend.test/emails/batch",
      "http://resend.test/emails",
    ]);
    const single = mock.calls[1].body as {
      attachments: { content_id: string; content_type: string }[];
      headers: Record<string, string>;
    };
    expect(single.attachments[0]).toMatchObject({
      content_id: "media-0",
      content_type: "image/png",
    });
    expect(single.headers["List-Unsubscribe"]).toBe("<http://x.test/u>");
    expect(results.map((r) => r.id)).toEqual(["abc", "plain"]);
  } finally {
    mock.restore();
  }
});

test("Resend's exact error is returned for every message that failed", async () => {
  const mock = mockFetch(() => ({
    status: 403,
    json: {
      statusCode: 403,
      name: "validation_error",
      message: "The example.test domain is not verified.",
    },
  }));
  try {
    const results = await deliver(config, [message(1), message(2)], {
      pauseMs: 0,
    });
    expect(results.map((r) => r.error)).toEqual([
      "The example.test domain is not verified.",
      "The example.test domain is not verified.",
    ]);
  } finally {
    mock.restore();
  }
});

test("unsubscribe links are signed, tamper-proof and carry member and category", () => {
  const secret = "a-long-enough-secret-for-tests";
  const token = signUnsubscribe(secret, "member-1", "event");
  expect(readUnsubscribe(secret, token)).toEqual({
    memberId: "member-1",
    category: "event",
  });
  expect(readUnsubscribe("another-long-secret-for-tests", token)).toBeNull();
  expect(
    readUnsubscribe(
      secret,
      token.replace(/.$/, (c) => (c === "a" ? "b" : "a")),
    ),
  ).toBeNull();
  expect(
    readUnsubscribe(secret, signUnsubscribe(secret, "m", "nonsense")),
  ).toBeNull();
  expect(readUnsubscribe(secret, "garbage")).toBeNull();
});

test("unsubscribing turns off one kind, or everything, and opted-out members get no email", () => {
  const one = withUnsubscribed(undefined, "event");
  expect(wantsEmail(one, "event")).toBe(false);
  expect(wantsEmail(one, "announcement")).toBe(true);
  const all = withUnsubscribed(one, "all");
  expect(wantsEmail(all, "announcement")).toBe(false);
});

test("a reply-to address is sent to Resend as reply_to", async () => {
  const mock = mockFetch(() => ({ status: 200, json: { id: "x" } }));
  try {
    await deliver(
      config,
      [
        message(1, {
          replyTo: "visitor@example.test",
          attachments: [
            { filename: "a", content: "AA", contentType: "text/plain" },
          ],
        }),
      ],
      { pauseMs: 0 },
    );
    expect(mock.calls[0].body).toMatchObject({
      reply_to: "visitor@example.test",
    });
  } finally {
    mock.restore();
  }
});
