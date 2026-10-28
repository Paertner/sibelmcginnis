import Image from "next/image";
import { safeHtml } from "@/lib/safe-html";
import type { EmailBlock } from "@/lib/email-blocks";

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Older posts and notes are plain text; each paragraph becomes a text block. */
export function textToBlocks(text: string): EmailBlock[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => ({
      id: `t${index}`,
      type: "text" as const,
      html: escapeText(part).replace(/\n/g, "<br>"),
    }));
}
const html = (value = "") =>
  safeHtml(value.replaceAll("{{account_url}}", "/account"));

/** Renders editor blocks as a web article (posts and session notes). */
export function BlockContent({ blocks }: { blocks: EmailBlock[] }) {
  return (
    <div className="article block-article">
      {blocks.map((block) => {
        switch (block.type) {
          case "header":
            return (
              <div className="article-banner" key={block.id}>
                {block.eyebrow ? <p>{block.eyebrow}</p> : null}
                <h2>{block.title}</h2>
              </div>
            );
          case "heading":
            return <h2 key={block.id}>{block.text}</h2>;
          case "text":
            return (
              <div
                key={block.id}
                className="article-text"
                dangerouslySetInnerHTML={{ __html: html(block.html) }}
              />
            );
          case "quote":
            return (
              <blockquote
                key={block.id}
                dangerouslySetInnerHTML={{ __html: html(block.html) }}
              />
            );
          case "note":
            return (
              <p
                key={block.id}
                className="article-note"
                dangerouslySetInnerHTML={{ __html: html(block.html) }}
              />
            );
          case "image": {
            if (!block.path) return null;
            const image = (
              <Image
                src={block.path}
                alt={block.alt ?? ""}
                width={1200}
                height={800}
                unoptimized
                sizes="(max-width: 780px) 90vw, 730px"
              />
            );
            return (
              <figure key={block.id} className="article-figure">
                {block.href ? (
                  <a href={block.href} target="_blank" rel="noopener noreferrer">
                    {image}
                  </a>
                ) : (
                  image
                )}
              </figure>
            );
          }
          case "button":
            return (
              <p key={block.id} className="article-cta">
                <a
                  className="btn"
                  href={(block.href ?? "").replace("{{account_url}}", "/account")}
                >
                  {block.label}
                </a>
              </p>
            );
          case "divider":
            return <hr key={block.id} className="article-divider" />;
          case "spacer":
            return (
              <div
                key={block.id}
                className={`article-spacer ${block.size ?? "medium"}`}
              />
            );
          case "html":
            return (
              <div
                key={block.id}
                dangerouslySetInnerHTML={{ __html: html(block.html) }}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
