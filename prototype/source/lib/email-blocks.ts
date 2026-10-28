// Email messages are built from blocks and rendered to table-based, inline-styled HTML.
export const blockTypes = [
  "header",
  "heading",
  "text",
  "image",
  "button",
  "quote",
  "divider",
  "spacer",
  "note",
  "html",
] as const;
export type BlockType = (typeof blockTypes)[number];

/** Optional look of a block; anything unset uses the block type's default. */
export type BlockStyle = {
  align?: "left" | "center" | "right";
  color?: string;
  background?: string;
  accent?: string;
  fontSize?: "small" | "normal" | "large";
  space?: "none" | "small" | "medium" | "large";
  width?: "full" | "wide" | "half";
  shape?: "rounded" | "pill" | "square";
  thickness?: "thin" | "medium" | "thick";
};
export type StyleKey = keyof BlockStyle;
export type EmailBlock = {
  id: string;
  type: BlockType;
  eyebrow?: string;
  title?: string;
  text?: string;
  html?: string;
  path?: string;
  mediaId?: string;
  alt?: string;
  href?: string;
  label?: string;
  size?: "small" | "medium" | "large";
  style?: BlockStyle;
};
export type SavedEmailTemplate = {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  footer: boolean;
  updatedAt: string;
};

/** Which style settings each block offers, in the order they appear. */
export const styleControls: Record<BlockType, StyleKey[]> = {
  header: ["align", "background", "color", "accent", "space"],
  heading: ["align", "fontSize", "color", "background", "space"],
  text: ["align", "fontSize", "color", "background", "space"],
  quote: ["align", "fontSize", "color", "background", "accent", "space"],
  note: ["align", "fontSize", "color", "space"],
  image: ["align", "width", "shape", "space"],
  button: ["align", "accent", "color", "shape", "width", "space"],
  divider: ["accent", "thickness", "width", "align", "space"],
  spacer: [],
  html: [],
};
const defaults: Record<BlockType, Required<Pick<BlockStyle, "align">> & BlockStyle> = {
  header: { align: "left", background: "#2d221c", color: "#f6ede6", accent: "#c0a385" },
  heading: { align: "left", color: "#2d221c", fontSize: "normal" },
  text: { align: "left", color: "#4b3d34", fontSize: "normal" },
  quote: { align: "left", color: "#4b3d34", background: "#f6e7dd", accent: "#c0a385", fontSize: "normal" },
  note: { align: "center", color: "#8d7a6d", fontSize: "small" },
  image: { align: "center", width: "full", shape: "rounded" },
  button: { align: "left", accent: "#9b5e41", color: "#ffffff", shape: "rounded" },
  divider: { align: "center", accent: "#f0e4db", thickness: "thin", width: "full" },
  spacer: { align: "left" },
  html: { align: "left" },
};
const fontSizes: Record<string, Record<string, number>> = {
  heading: { small: 18, normal: 22, large: 28 },
  note: { small: 12, normal: 14, large: 16 },
  default: { small: 14, normal: 16, large: 19 },
};
const margins: Record<BlockType, string> = {
  header: "",
  heading: "24px 0 8px",
  text: "12px 0",
  quote: "20px 0",
  note: "12px 0",
  image: "16px 0",
  button: "24px 0",
  divider: "24px 0",
  spacer: "0",
  html: "0",
};
const spaces = { none: "0", small: "8px 0", large: "32px 0" };

/** The resolved look of a block, shared by emails, web pages and the editor. */
export function blockLook(block: EmailBlock) {
  const style = { ...defaults[block.type], ...block.style };
  const sizes = fontSizes[block.type] ?? fontSizes.default;
  return {
    align: style.align,
    color: style.color,
    background: style.background,
    accent: style.accent,
    fontSize: sizes[style.fontSize ?? "normal"],
    margin:
      style.space && style.space !== "medium"
        ? spaces[style.space]
        : margins[block.type],
    radius:
      style.shape === "pill" ? 999 : style.shape === "square" ? 0 : block.type === "image" ? 14 : 12,
    width: { full: 100, wide: 75, half: 50 }[style.width ?? "full"],
    fullWidth: style.width === "full" && block.type === "button",
    thickness: { thin: 1, medium: 2, thick: 4 }[style.thickness ?? "thin"],
    /** Header padding grows or shrinks with the space setting. */
    padding:
      style.space === "none" ? 18 : style.space === "small" ? 24 : style.space === "large" ? 44 : 32,
  };
}

/** Merge fields such as {{first_name}} that are filled in for each recipient. */
export const placeholders = [
  { key: "first_name", label: "Member’s first name", sample: "Amelia" },
  { key: "full_name", label: "Member’s full name", sample: "Amelia Hart" },
  { key: "site_url", label: "Website home page", path: "/" },
  { key: "account_url", label: "Member account", path: "/account" },
  { key: "blog_url", label: "Blog", path: "/blog" },
  { key: "podcast_url", label: "Podcast", path: "/account?tab=podcast" },
  { key: "sessions_url", label: "Session notes", path: "/account?tab=sessions" },
  { key: "booking_url", label: "Book a consultation", path: "/account?tab=book" },
  { key: "membership_url", label: "Membership", path: "/account?tab=membership" },
  { key: "preferences_url", label: "Email preferences", path: "/account?tab=membership" },
  { key: "unsubscribe_url", label: "Unsubscribe", path: "/account?tab=membership" },
] as const;
/** Replaces merge fields. Links use `origin` (empty for links within the site). */
export function fillPlaceholders(
  html: string,
  { origin = "", name }: { origin?: string; name?: string },
) {
  let out = html;
  for (const field of placeholders) {
    const value =
      "path" in field
        ? `${origin}${field.path}`
        : field.key === "first_name"
          ? (name?.split(" ")[0] ?? field.sample)
          : (name ?? field.sample);
    out = out.replaceAll(`{{${field.key}}}`, value);
  }
  return out;
}

const newId = () => Math.random().toString(36).slice(2, 10);
export const blockCatalog: {
  type: BlockType;
  label: string;
  hint: string;
  create: () => EmailBlock;
}[] = [
  {
    type: "header",
    label: "Header banner",
    hint: "Dark title band",
    create: () => ({
      id: newId(),
      type: "header",
      eyebrow: "MORNING COFFEE COMMUNITY",
      title: "Your headline",
    }),
  },
  {
    type: "heading",
    label: "Heading",
    hint: "Section title",
    create: () => ({ id: newId(), type: "heading", text: "Section title" }),
  },
  {
    type: "text",
    label: "Text",
    hint: "Paragraphs and lists",
    create: () => ({ id: newId(), type: "text", html: "Write something…" }),
  },
  {
    type: "image",
    label: "Image",
    hint: "From the media library",
    create: () => ({ id: newId(), type: "image", path: "", alt: "" }),
  },
  {
    type: "button",
    label: "Button",
    hint: "Call to action",
    create: () => ({
      id: newId(),
      type: "button",
      label: "Open my account",
      href: "{{account_url}}",
    }),
  },
  {
    type: "quote",
    label: "Highlight",
    hint: "Quote or reflection",
    create: () => ({
      id: newId(),
      type: "quote",
      html: "A thought worth holding onto.",
    }),
  },
  {
    type: "divider",
    label: "Divider",
    hint: "Thin line",
    create: () => ({ id: newId(), type: "divider" }),
  },
  {
    type: "spacer",
    label: "Spacer",
    hint: "Empty space",
    create: () => ({ id: newId(), type: "spacer", size: "medium" }),
  },
  {
    type: "note",
    label: "Small print",
    hint: "Centered fine print",
    create: () => ({ id: newId(), type: "note", html: "Small print" }),
  },
  {
    type: "html",
    label: "HTML code",
    hint: "Your own markup",
    create: () => ({ id: newId(), type: "html", html: "<p>Custom HTML</p>" }),
  },
];
export const withNewIds = (blocks: readonly EmailBlock[]) =>
  blocks.map((block) => ({ ...block, id: newId() }));

const escape = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const font = "font-family:Arial,Helvetica,sans-serif";
const spacer = { small: 12, medium: 24, large: 40 };
/** Text blocks with a background get inner padding and rounded corners. */
const boxed = (background?: string, defaultBackground?: string) =>
  background && background !== defaultBackground
    ? `;background-color:${background};padding:16px 20px;border-radius:12px`
    : "";

function blockHtml(block: EmailBlock): string[] {
  const look = blockLook(block);
  const align = `text-align:${look.align}`;
  switch (block.type) {
    case "heading":
      return [
        `<h2 style="${font};font-size:${look.fontSize}px;font-weight:normal;line-height:1.3;color:${look.color};${align};margin:${look.margin}${boxed(look.background)}">${escape(block.text)}</h2>`,
      ];
    case "text":
    case "note":
      return [
        `<div style="${font};font-size:${look.fontSize}px;line-height:1.6;color:${look.color};${align};margin:${look.margin}${boxed(look.background)}">`,
        `  ${block.html ?? ""}`,
        "</div>",
      ];
    case "quote":
      return [
        `<div style="${font};font-size:${look.fontSize}px;line-height:1.6;color:${look.color};${align};background-color:${look.background};border-left:4px solid ${look.accent};padding:16px 20px;margin:${look.margin}">`,
        `  ${block.html ?? ""}`,
        "</div>",
      ];
    case "image": {
      if (!block.path) return [];
      const pixels = Math.round((536 * look.width) / 100);
      const image = `<img src="${escape(block.path)}" alt="${escape(block.alt)}" width="${pixels}" style="display:inline-block;width:${look.width}%;max-width:${pixels}px;border-radius:${look.radius}px">`;
      return [
        `<div style="${align};margin:${look.margin}">`,
        ...(block.href
          ? [`  <a href="${escape(block.href)}">`, `    ${image}`, "  </a>"]
          : [`  ${image}`]),
        "</div>",
      ];
    }
    case "button":
      return [
        `<p style="${align};margin:${look.margin}">`,
        `  <a href="${escape(block.href)}" style="${font};display:${look.fullWidth ? "block" : "inline-block"};text-align:center;background-color:${look.accent};color:${look.color};font-size:16px;font-weight:bold;padding:14px 24px;border-radius:${look.radius}px;text-decoration:none">${escape(block.label)}</a>`,
        "</p>",
      ];
    case "divider":
      return [
        `<div style="${align};margin:${look.margin}">`,
        `  <div style="display:inline-block;width:${look.width}%;height:${look.thickness}px;background-color:${look.accent}"></div>`,
        "</div>",
      ];
    case "spacer":
      return [`<div style="height:${spacer[block.size ?? "medium"]}px"></div>`];
    case "html":
      return formatHtml(block.html ?? "").split("\n");
    default:
      return [];
  }
}
const indent = (lines: string[], depth: number) =>
  lines.map((line) => "  ".repeat(depth) + line);
function rows(blocks: EmailBlock[], background?: string) {
  const out: string[] = [];
  for (const block of blocks) {
    if (block.type === "header") {
      const look = blockLook(block);
      out.push(
        "<tr>",
        `  <td style="padding:${look.padding}px 32px;background-color:${look.background};text-align:${look.align}">`,
        `    <p style="${font};font-size:12px;color:${look.accent};margin:0 0 10px">${escape(block.eyebrow)}</p>`,
        `    <h1 style="${font};font-size:30px;font-weight:normal;line-height:1.2;color:${look.color};margin:0">${escape(block.title)}</h1>`,
        "  </td>",
        "</tr>",
      );
      continue;
    }
    const inner = blockHtml(block);
    if (!inner.length) continue;
    out.push(
      "<tr>",
      `  <td style="padding:0 32px${background ? `;background-color:${background}` : ""}">`,
      ...indent(inner, 2),
      "  </td>",
      "</tr>",
    );
  }
  return out;
}
/** Renders blocks (and an optional shared footer) as readable, indented email HTML. */
export function renderEmail(blocks: EmailBlock[], footer?: EmailBlock[]) {
  const body = [
    ...rows(blocks),
    "<tr>",
    `  <td style="height:24px"></td>`,
    "</tr>",
    ...(footer?.length
      ? [
          ...rows(footer, "#faf6f2"),
          "<tr>",
          `  <td style="height:16px;background-color:#faf6f2"></td>`,
          "</tr>",
        ]
      : []),
  ];
  return [
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5efe9;padding:28px 12px">`,
    "  <tr>",
    `    <td align="center">`,
    `      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:20px">`,
    ...indent(body, 4),
    "      </table>",
    "    </td>",
    "  </tr>",
    "</table>",
  ].join("\n");
}

const blockTags =
  /^(table|thead|tbody|tfoot|tr|td|th|div|p|h[1-6]|ul|ol|li|blockquote|hr|br|img)$/i;
const voidTags = /^(br|hr|img|meta|link|input)$/i;
/** Puts block-level tags on their own indented lines; inline markup stays inside its line. */
export function formatHtml(html: string) {
  const tokens = html
    .replace(/>\s+</g, "><")
    .trim()
    .split(/(<[^>]+>)/)
    .filter(Boolean);
  const lines: string[] = [];
  let depth = 0,
    current = "";
  const flush = () => {
    if (current.trim()) lines.push("  ".repeat(depth) + current.trim());
    current = "";
  };
  for (const token of tokens) {
    const tag = token.match(/^<\/?([a-z0-9]+)/i)?.[1] ?? "";
    if (!token.startsWith("<") || !blockTags.test(tag)) {
      current += token;
      continue;
    }
    if (/^br$/i.test(tag)) {
      current += token;
      continue;
    }
    flush();
    if (token.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      lines.push("  ".repeat(depth) + token);
    } else {
      lines.push("  ".repeat(depth) + token);
      if (!voidTags.test(tag) && !token.endsWith("/>")) depth++;
    }
  }
  flush();
  return lines.join("\n");
}

const styleChoices: Partial<Record<StyleKey, readonly string[]>> = {
  align: ["left", "center", "right"],
  fontSize: ["small", "normal", "large"],
  space: ["none", "small", "medium", "large"],
  width: ["full", "wide", "half"],
  shape: ["rounded", "pill", "square"],
  thickness: ["thin", "medium", "thick"],
};
/** Keeps only known style settings with valid values (colors as #rrggbb). */
function parseStyle(raw: unknown): BlockStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "string") continue;
    if (["color", "background", "accent"].includes(key)) {
      if (/^#[0-9a-f]{6}$/i.test(value)) style[key] = value.toLowerCase();
    } else if (styleChoices[key as StyleKey]?.includes(value)) style[key] = value;
  }
  return Object.keys(style).length ? (style as BlockStyle) : undefined;
}

/** Server-side check for blocks posted from the editor. */
export function parseBlocks(json: string): EmailBlock[] {
  let value: unknown;
  try {
    value = JSON.parse(json || "[]");
  } catch {
    throw new Error("The email blocks could not be read. Try again.");
  }
  if (!Array.isArray(value) || value.length > 80)
    throw new Error("An email can have up to 80 blocks.");
  const fields = [
    "eyebrow",
    "title",
    "text",
    "html",
    "path",
    "mediaId",
    "alt",
    "href",
    "label",
  ] as const;
  return value.map((raw) => {
    const item = raw as Record<string, unknown>;
    if (!blockTypes.includes(item.type as BlockType))
      throw new Error("One of the email blocks is not supported.");
    const block: EmailBlock = {
      id: String(item.id ?? newId()).slice(0, 40),
      type: item.type as BlockType,
    };
    for (const field of fields)
      if (typeof item[field] === "string")
        block[field] = (item[field] as string).slice(0, 50000);
    if (["small", "medium", "large"].includes(item.size as string))
      block.size = item.size as EmailBlock["size"];
    const style = parseStyle(item.style);
    if (style) block.style = style;
    return block;
  });
}
