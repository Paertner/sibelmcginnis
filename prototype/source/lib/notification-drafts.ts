import { getStore } from "./store";
import { mediaLibrary, siteImage } from "./site-images";
import type { EmailBlock } from "./email-blocks";

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
 * or "podcast:<id>". The admin still chooses recipients and can edit everything.
 */
export function notificationDraft(about?: string) {
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
  return undefined;
}
