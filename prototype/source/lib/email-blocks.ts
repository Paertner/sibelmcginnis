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
};
export type SavedEmailTemplate = {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  footer: boolean;
  updatedAt: string;
};

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

function blockHtml(block: EmailBlock): string[] {
  switch (block.type) {
    case "heading":
      return [
        `<h2 style="${font};font-size:22px;font-weight:normal;line-height:1.3;color:#2d221c;margin:24px 0 8px">${escape(block.text)}</h2>`,
      ];
    case "text":
      return [
        `<div style="${font};font-size:16px;line-height:1.6;color:#4b3d34;margin:12px 0">`,
        `  ${block.html ?? ""}`,
        "</div>",
      ];
    case "quote":
      return [
        `<div style="${font};font-size:16px;line-height:1.6;color:#4b3d34;background-color:#f6e7dd;border-left:4px solid #c0a385;padding:16px 20px;margin:20px 0">`,
        `  ${block.html ?? ""}`,
        "</div>",
      ];
    case "note":
      return [
        `<div style="${font};font-size:12px;line-height:1.6;color:#8d7a6d;text-align:center;margin:12px 0">`,
        `  ${block.html ?? ""}`,
        "</div>",
      ];
    case "image": {
      if (!block.path) return [];
      const image = `<img src="${escape(block.path)}" alt="${escape(block.alt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:14px;margin:16px 0">`;
      return block.href
        ? [`<a href="${escape(block.href)}">`, `  ${image}`, "</a>"]
        : [image];
    }
    case "button":
      return [
        `<p style="margin:24px 0">`,
        `  <a href="${escape(block.href)}" style="${font};display:inline-block;background-color:#9b5e41;color:#ffffff;font-size:16px;font-weight:bold;padding:14px 24px;border-radius:12px;text-decoration:none">${escape(block.label)}</a>`,
        "</p>",
      ];
    case "divider":
      return [
        `<div style="height:1px;background-color:#f0e4db;margin:24px 0"></div>`,
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
      out.push(
        "<tr>",
        `  <td style="padding:32px;background-color:#2d221c">`,
        `    <p style="${font};font-size:12px;color:#c0a385;margin:0 0 10px">${escape(block.eyebrow)}</p>`,
        `    <h1 style="${font};font-size:30px;font-weight:normal;line-height:1.2;color:#f6ede6;margin:0">${escape(block.title)}</h1>`,
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
    return block;
  });
}
