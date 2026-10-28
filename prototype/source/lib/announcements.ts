import "server-only";
import { randomUUID } from "node:crypto";
import {
  getDemoState,
  getStore,
  type Announcement,
  type Member,
} from "./store";
import { htmlText, safeHtml, escapeHtml } from "./safe-html";
import { today } from "./dates";
import { siteOrigin } from "./site-url";
import { memberRole } from "./membership";
import { assertEmailQuota, recordEmails } from "./email-quota";

export function announcementVisible(
  announcement: Announcement,
  memberId: string,
  role: string,
) {
  return announcement.recipientIds
    ? announcement.recipientIds.includes(memberId)
    : announcement.audience === "all" || announcement.audience === role;
}
export function personalizedHtml(
  announcement: Announcement,
  member: Pick<Member, "name">,
) {
  const html =
    announcement.html ||
    `<p>${escapeHtml(announcement.body).replace(/\n/g, "<br>")}</p>`;
  return safeHtml(
    html
      .replaceAll("{{first_name}}", escapeHtml(member.name.split(" ")[0]))
      .replaceAll("{{account_url}}", `${siteOrigin()}/account`),
  );
}

export async function publishAnnouncement(form: FormData) {
  const subject = String(form.get("subject") ?? "").trim();
  const raw = String(form.get("html") ?? "").trim();
  if (!subject || subject.length > 250 || /[\r\n]/.test(subject))
    throw new Error("Enter a subject of up to 250 characters.");
  if (!raw || raw.length > 150000)
    throw new Error("Add a message of up to 150,000 characters.");
  if (/https?:\/\/(?:[a-z0-9-]+\.)*zoom\.(?:us|com)\//i.test(raw))
    throw new Error(
      "Use a protected session page link instead of a direct Zoom link in your message.",
    );
  const html = safeHtml(raw),
    body = htmlText(html);
  if (!body) throw new Error("Add some message text.");
  const groups = [...new Set(form.getAll("groups").map(String))];
  if (groups.some((g) => !["all", "free", "premium"].includes(g)))
    throw new Error("Choose a valid member group.");
  const ids = [...new Set(form.getAll("recipients").map(String))];
  const members = getStore().members;
  if (ids.some((id) => !members.some((m) => m.id === id)))
    throw new Error(
      "Recipients must be registered members. Refresh your selection.",
    );
  const recipients = members.filter(
    (m) =>
      ids.includes(m.id) ||
      groups.includes("all") ||
      groups.includes(memberRole(m)),
  );
  if (!recipients.length)
    throw new Error("Choose at least one member or group.");
  assertEmailQuota(recipients.length);
  const file = form.get("image");
  let upload: { bytes: Uint8Array; type: string; name: string } | undefined;
  if (file instanceof File && file.size) {
    if (
      file.size > 3 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new Error("Choose a JPG, PNG or WebP image up to 3 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hex = Buffer.from(bytes.subarray(0, 12)).toString("hex");
    if (
      !(file.type === "image/png" && hex.startsWith("89504e470d0a1a0a")) &&
      !(file.type === "image/jpeg" && hex.startsWith("ffd8ff")) &&
      !(
        file.type === "image/webp" &&
        Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
        Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
      )
    )
      throw new Error("The image file does not match its format.");
    upload = {
      bytes,
      type: file.type,
      name: file.name.replace(/[\r\n"\\]/g, "_").slice(0, 100),
    };
  }
  // Resolve recipients once and deduplicate groups + individuals, preserving delivery history.
  const id = randomUUID(),
    state = getDemoState();
  state.data.announcements.push({
    id,
    subject,
    body,
    html,
    audience: "selected",
    groups,
    recipientIds: recipients.map((m) => m.id),
    date: today(),
    imageId: upload ? id : undefined,
    emailStatus: "prepared",
  });
  if (upload) state.images.set(id, upload);
  for (const member of recipients)
    state.emailDrafts.push({
      id: randomUUID(),
      announcementId: id,
      memberId: member.id,
      to: member.email,
      name: member.name,
      subject,
    });
  recordEmails(recipients.length);
  return recipients.length;
}

/** RFC 5322/MIME draft with an inline CID image; never reports delivery without an email provider. */
export function emailDraft(draftId: string) {
  const state = getDemoState(),
    draft = state.emailDrafts.find((d) => d.id === draftId);
  const announcement =
    draft &&
    state.data.announcements.find((a) => a.id === draft.announcementId);
  if (!draft || !announcement) return null;
  const boundary = `mcc-${draft.id}`,
    image = announcement.imageId && state.images.get(announcement.imageId);
  // Library images in the message travel inside the email; other site links become absolute.
  const inline = [
    ...new Set(
      [
        ...personalizedHtml(announcement, { name: draft.name }).matchAll(
          /\/api\/site-image\/([\w-]+)/g,
        ),
      ].map((match) => match[1]),
    ),
  ].filter((id) => state.images.has(id));
  let content = personalizedHtml(announcement, { name: draft.name });
  inline.forEach((id, index) => {
    content = content.replaceAll(`/api/site-image/${id}`, `cid:media-${index}`);
  });
  content = content.replace(/(src|href)="\//g, `$1="${siteOrigin()}/`);
  const html = image
    ? `<img src="cid:session-image" alt="Session image" style="display:block;max-width:600px;width:100%;margin:auto">${content}`
    : content;
  const base64 = (value: Buffer) =>
    value
      .toString("base64")
      .match(/.{1,76}/g)
      ?.join("\r\n") ?? "";
  const lines = [
    `To: ${draft.to.replace(/[\r\n]/g, "")}`,
    `Subject: =?UTF-8?B?${Buffer.from(draft.subject).toString("base64")}?=`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "X-Unsent: 1",
    `Content-Type: multipart/related; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64(Buffer.from(html)),
  ];
  if (image)
    lines.push(
      `--${boundary}`,
      `Content-Type: ${image.type}`,
      "Content-Transfer-Encoding: base64",
      "Content-ID: <session-image>",
      `Content-Disposition: inline; filename="${image.name}"`,
      "",
      base64(Buffer.from(image.bytes)),
    );
  inline.forEach((id, index) => {
    const media = state.images.get(id)!;
    lines.push(
      `--${boundary}`,
      `Content-Type: ${media.type}`,
      "Content-Transfer-Encoding: base64",
      `Content-ID: <media-${index}>`,
      `Content-Disposition: inline; filename="${media.name}"`,
      "",
      base64(Buffer.from(media.bytes)),
    );
  });
  lines.push(`--${boundary}--`, "");
  return lines.join("\r\n");
}
