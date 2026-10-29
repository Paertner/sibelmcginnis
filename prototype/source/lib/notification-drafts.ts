import { getStore } from "./store";
import { mediaLibrary, siteImage } from "./site-images";
import type { EmailBlock } from "./email-blocks";
import { fmtDate } from "./dates";
import { isPaid, seatsLeft, timeRange } from "./event-posts";

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const signOff: EmailBlock = {
  id: "signoff",
  type: "text",
  html: "With care,<br><strong>Sibel</strong>",
};
const hello: EmailBlock = {
  id: "hello",
  type: "text",
  html: "Hello {{first_name}},",
};

/**
 * Builds the email behind a "Send notification" button: `about` is "post:<id>"
 * "podcast:<id>", "event:<id>" or "eventreminder:<id>". The admin still chooses recipients and can edit everything.
 */
export function notificationDraft(about?: string): {
  subject: string;
  category: string;
  groups: string[];
  recipientIds?: string[];
  blocks: EmailBlock[];
} | undefined {
  if (!about) return undefined;
  const [kind, id] = about.split(":");
  const data = getStore();
  if (kind === "post") {
    const post = data.posts.find(
      (entry) => entry.id === id && entry.status === "published",
    );
    if (!post) return undefined;
    const cover = siteImage(`post.${post.id}`);
    const path =
      mediaLibrary().find((item) => item.id === cover.mediaId)?.path ?? "";
    return {
      subject: `New on the blog: ${post.title}`,
      category: "post",
      groups: [post.access === "premium" ? "premium" : "all"],
      blocks: [
        {
          id: "header",
          type: "header",
          eyebrow: "MORNING COFFEE COMMUNITY · NEW POST",
          title: post.title,
        },
        ...(path
          ? [{ id: "cover", type: "image", path, alt: cover.alt } as const]
          : []),
        hello,
        { id: "excerpt", type: "text", html: escapeText(post.excerpt) },
        {
          id: "cta",
          type: "button",
          label: "Read the post",
          href: `/post/${post.id}`,
        },
        signOff,
      ] as EmailBlock[],
    };
  }
  if (kind === "podcast") {
    const episode = data.podcasts.find(
      (entry) => entry.id === id && entry.status === "published",
    );
    if (!episode) return undefined;
    return {
      subject: `New episode: ${episode.title}`,
      category: "podcast",
      groups: ["premium"],
      blocks: [
        {
          id: "header",
          type: "header",
          eyebrow: "MORNING COFFEE PODCAST · NEW EPISODE",
          title: `#${episode.num} ${episode.title}`,
        },
        hello,
        {
          id: "description",
          type: "text",
          html: escapeText(episode.description),
        },
        {
          id: "cta",
          type: "button",
          label: "Listen now",
          href: `/account?tab=podcast#${episode.id}`,
        },
        signOff,
      ] as EmailBlock[],
    };
  }
  if (kind === "event" || kind === "eventreminder") {
    const event = (data.events ?? []).find(
      (entry) => entry.id === id && entry.status === "published",
    );
    if (!event) return undefined;
    const cover = siteImage(`event.${event.id}`);
    const path =
      mediaLibrary().find((item) => item.id === cover.mediaId)?.path ?? "";
    const when = `${fmtDate(event.date, { weekday: "long", month: "long", day: "numeric" })}, ${timeRange(event)}`;
    const where = [event.venue, event.address].filter(Boolean).join(", ");
    const details = `<strong>When:</strong> ${escapeText(when)}<br><strong>Where:</strong> ${escapeText(where)}${isPaid(event) ? `<br><strong>Price:</strong> ${escapeText(event.price)}` : ""}`;
    const reminder = kind === "eventreminder";
    return {
      subject: reminder
        ? `Reminder: ${event.title}`
        : `You’re invited: ${event.title}`,
      category: "event",
      // A reminder goes only to the people who joined, as individual recipients.
      groups: reminder ? [] : ["all"],
      recipientIds: reminder ? event.attendees : [],
      blocks: [
        {
          id: "header",
          type: "header",
          eyebrow: reminder
            ? "MORNING COFFEE COMMUNITY · EVENT REMINDER"
            : "MORNING COFFEE COMMUNITY · NEW EVENT",
          title: event.title,
        },
        ...(path && !reminder
          ? [{ id: "cover", type: "image", path, alt: cover.alt } as const]
          : []),
        hello,
        {
          id: "intro",
          type: "text",
          html: reminder
            ? `This is a friendly reminder that you have a seat at <strong>${escapeText(event.title)}</strong>. We can’t wait to see you.`
            : `${escapeText(event.summary)}${seatsLeft(event) ? ` There are ${seatsLeft(event)} seats left, so join soon.` : ""}`,
        },
        { id: "details", type: "text", html: details },
        {
          id: "cta",
          type: "button",
          label: reminder ? "See event details" : "Join the event",
          href: `/event/${event.id}`,
        },
        signOff,
      ] as EmailBlock[],
    };
  }
  return undefined;
}
