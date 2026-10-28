import Image from "next/image";
import { safeHtml } from "@/lib/safe-html";
import {
  blockLook,
  fillPlaceholders,
  type EmailBlock,
} from "@/lib/email-blocks";

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
// On the website there is no recipient, so name fields read "friend" and links stay on the site.
const fill = (value = "") => fillPlaceholders(value, { name: "friend" });
const html = (value = "") => safeHtml(fill(value));

/** Renders editor blocks as a web article (posts and session notes), with each block's style. */
export function BlockContent({ blocks }: { blocks: EmailBlock[] }) {
  return (
    <div className="article block-article">
      {blocks.map((block) => {
        const look = blockLook(block);
        const box = look.background
          ? { background: look.background, padding: "16px 20px", borderRadius: 16 }
          : {};
        const text = {
          color: look.color,
          fontSize: look.fontSize + 1,
          textAlign: look.align,
          margin: look.margin,
        };
        switch (block.type) {
          case "header":
            return (
              <div
                className="article-banner"
                key={block.id}
                style={{
                  background: look.background,
                  textAlign: look.align,
                  paddingTop: look.padding - 6,
                  paddingBottom: look.padding - 6,
                }}
              >
                {block.eyebrow ? (
                  <p style={{ color: look.accent }}>{fill(block.eyebrow)}</p>
                ) : null}
                <h2 style={{ color: look.color }}>{fill(block.title)}</h2>
              </div>
            );
          case "heading":
            return (
              <h2
                key={block.id}
                style={{ ...text, fontSize: look.fontSize + 4, ...box }}
              >
                {fill(block.text)}
              </h2>
            );
          case "text":
          case "note":
            return (
              <div
                key={block.id}
                className={block.type === "note" ? "article-note" : "article-text"}
                style={{ ...text, ...box }}
                dangerouslySetInnerHTML={{ __html: html(block.html) }}
              />
            );
          case "quote":
            return (
              <blockquote
                key={block.id}
                style={{
                  ...text,
                  background: look.background,
                  borderLeftColor: look.accent,
                }}
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
                style={{
                  display: "inline-block",
                  width: `${look.width}%`,
                  height: "auto",
                  borderRadius: look.radius,
                }}
              />
            );
            return (
              <figure
                key={block.id}
                className="article-figure"
                style={{ textAlign: look.align, margin: look.margin }}
              >
                {block.href ? (
                  <a href={fill(block.href)} target="_blank" rel="noopener noreferrer">
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
              <p
                key={block.id}
                className="article-cta"
                style={{ textAlign: look.align, margin: look.margin }}
              >
                <a
                  className="btn"
                  href={fill(block.href)}
                  style={{
                    background: look.accent,
                    color: look.color,
                    borderRadius: look.radius,
                    display: look.fullWidth ? "block" : undefined,
                    textAlign: "center",
                  }}
                >
                  {fill(block.label)}
                </a>
              </p>
            );
          case "divider":
            return (
              <div
                key={block.id}
                style={{ textAlign: look.align, margin: look.margin }}
              >
                <span
                  className="article-divider-line"
                  style={{
                    width: `${look.width}%`,
                    height: look.thickness,
                    background: look.accent,
                  }}
                />
              </div>
            );
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
