import "server-only";
import sanitizeHtml from "sanitize-html";
export function safeHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "div",
      "span",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "hr",
    ],
    allowedAttributes: {
      "*": ["style", "align", "valign", "width", "height", "role"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "style"],
      table: [
        "cellpadding",
        "cellspacing",
        "border",
        "role",
        "width",
        "style",
        "align",
      ],
      td: ["colspan", "rowspan", "style", "align", "valign", "width", "height"],
      th: ["colspan", "rowspan", "style", "align", "valign", "width", "height"],
    },
    allowedStyles: {
      "*": {
        color: [/^(#[\da-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i],
        "background-color": [/^(#[\da-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i],
        "font-size": [/^[\d.]+(px|em|rem|%)$/],
        "font-family": [/^[\w\s,'-]+$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic)$/],
        "text-align": [/^(left|right|center|justify)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
        "line-height": [/^[\d.]+(px|em|rem|%)?$/],
        padding: [/^[\d.\s]+(px|em|rem|%)?([\s\d.pxemr%]+)?$/],
        "padding-left": [/^[\d.]+(px|em|rem|%)$/],
        margin: [/^[\d.\s]+(px|em|rem|%)?([\s\d.pxemr%]+)?$/],
        "margin-top": [/^[\d.]+(px|em|rem|%)$/],
        width: [/^[\d.]+(px|%)$/],
        "max-width": [/^[\d.]+(px|%)$/],
        height: [/^[\d.]+(px|%)$/],
        "border-radius": [/^[\d.]+(px|%)$/],
        "border-left": [/^[\d.]+px solid #[\da-f]{3,8}$/i],
        display: [/^(block|inline|inline-block|table|table-cell)$/],
      },
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}
export const htmlText = (html: string) =>
  sanitizeHtml(html.replace(/<\/(?:p|div|h[1-4]|tr|li)>/gi, "\n"), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
