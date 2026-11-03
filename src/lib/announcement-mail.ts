import "server-only";
import {
  getDemoState,
  getStore,
  type Announcement,
  type Member,
} from "./store";
import { personalizedHtml } from "./announcements";
import { htmlText } from "./safe-html";
import { siteOrigin } from "./site-url";
import { sendBatch, type MailMessage } from "./mailer";
import { signUnsubscribe } from "./unsubscribe-token";
import { recordEmails } from "./email-quota";
import { adminClient } from "./supabase";
import { saveChanges } from "./db";

/** The secret that signs unsubscribe links. Without it no email may go out. */
function unsubscribeSecret() {
  const secret = process.env.SETTINGS_SECRET;
  if (!secret || secret.length < 16)
    throw new Error(
      "SETTINGS_SECRET is not set on the server, so emails cannot carry a safe unsubscribe link yet.",
    );
  return secret;
}

const UNSUBSCRIBE_LINK =
  /(?:https?:\/\/[^"'\s<]*)?\/account\?tab=emails&(?:amp;)?unsubscribe=1/g;

/** One personal email: inline images, unsubscribe link and the one-click header. */
export function buildAnnouncementMessage(
  announcement: Pick<
    Announcement,
    "id" | "subject" | "html" | "body" | "category" | "imageId"
  >,
  member: Pick<Member, "id" | "name" | "email">,
  { subjectPrefix = "" }: { subjectPrefix?: string } = {},
): MailMessage {
  const state = getDemoState(),
    origin = siteOrigin(),
    token = signUnsubscribe(
      unsubscribeSecret(),
      member.id,
      announcement.category || "announcement",
    ),
    page = `${origin}/unsubscribe?token=${token}`;
  let html = personalizedHtml(announcement as Announcement, member).replace(
    UNSUBSCRIBE_LINK,
    page,
  );
  // The image routes are private, so library images travel inside the email.
  const attachments: NonNullable<MailMessage["attachments"]> = [];
  const ids = [
    ...new Set(
      [...html.matchAll(/\/api\/site-image\/([\w-]+)/g)].map((m) => m[1]),
    ),
  ].filter((id) => state.images.has(id));
  ids.forEach((id, index) => {
    const media = state.images.get(id)!;
    html = html.replace(
      new RegExp(`(?:https?://[^"'\s<]*)?/api/site-image/${id}`, "g"),
      `cid:media-${index}`,
    );
    attachments.push({
      filename: media.name || `image-${index}`,
      content: Buffer.from(media.bytes).toString("base64"),
      contentType: media.type,
      contentId: `media-${index}`,
    });
  });
  html = html.replace(/(src|href)="\//g, `$1="${origin}/`);
  const image = announcement.imageId && state.images.get(announcement.imageId);
  if (image) {
    html = `<img src="cid:session-image" alt="" style="display:block;max-width:600px;width:100%;margin:auto">${html}`;
    attachments.push({
      filename: image.name || "image",
      content: Buffer.from(image.bytes).toString("base64"),
      contentType: image.type,
      contentId: "session-image",
    });
  }
  if (!html.includes(page))
    html += `<p style="font-size:12px;color:#777;text-align:center">You receive this because you are a member. <a href="${page}">Unsubscribe</a></p>`;
  return {
    to: member.email,
    subject: subjectPrefix + announcement.subject,
    html,
    text: `${htmlText(html.replace(/<img[^>]*>/g, ""))}\n\nUnsubscribe: ${page}`,
    headers: {
      "List-Unsubscribe": `<${origin}/api/unsubscribe?token=${token}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    ...(attachments.length ? { attachments } : {}),
  };
}

export type Delivery = { sent: number; failed: number; firstError?: string };

/** Sends one personal email to each member, writes one email_log row per email and counts the day's quota. */
export async function sendAnnouncement(
  announcement: Announcement,
  members: Pick<Member, "id" | "name" | "email">[],
): Promise<Delivery> {
  const messages = members.map((member) =>
    buildAnnouncementMessage(announcement, member),
  );
  const results = await sendBatch(messages);
  // The log row points at the announcement, so the announcement must be saved first.
  await saveChanges(getStore());
  const { error } = await adminClient()
    .from("email_log")
    .insert(
      results.map((result, index) => ({
        announcement_id: announcement.id,
        member_id: members[index].id,
        to_email: members[index].email,
        subject: announcement.subject,
        resend_id: result.id ?? null,
        status: result.error ? "failed" : "sent",
        error: result.error ?? null,
      })),
    );
  if (error) console.error("[email] could not write the log:", error.message);
  const sent = results.filter((result) => !result.error).length;
  recordEmails(sent);
  return {
    sent,
    failed: results.length - sent,
    firstError: results.find((result) => result.error)?.error,
  };
}

/** Members whose email for this announcement failed and was never sent afterwards. */
export async function failedRecipients(announcementId: string) {
  const { data } = await adminClient()
    .from("email_log")
    .select("member_id,status")
    .eq("announcement_id", announcementId);
  const done = new Set<string>(),
    failed = new Set<string>();
  for (const row of data ?? [])
    (row.status === "sent" ? done : failed).add(String(row.member_id));
  return getStore().members.filter((m) => failed.has(m.id) && !done.has(m.id));
}

/** Per announcement: how many emails went out and how many failed (for the history list). */
export async function deliverySummary() {
  const { data } = await adminClient()
    .from("email_log")
    .select("announcement_id,member_id,status");
  const sent = new Map<string, Set<string>>(),
    failed = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const map = row.status === "sent" ? sent : failed;
    const id = String(row.announcement_id);
    if (!map.has(id)) map.set(id, new Set());
    map.get(id)!.add(String(row.member_id));
  }
  const summary = new Map<string, { sent: number; failed: number }>();
  for (const id of new Set([...sent.keys(), ...failed.keys()])) {
    const done = sent.get(id) ?? new Set<string>();
    summary.set(id, {
      sent: done.size,
      failed: [...(failed.get(id) ?? [])].filter((m) => !done.has(m)).length,
    });
  }
  return summary;
}

/** Stops early, before anything is published, when emails could not be sent safely. */
export const assertCanSend = () => void unsubscribeSecret();
