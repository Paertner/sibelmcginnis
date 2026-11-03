import {
  fillPlaceholders,
  renderEmail,
  type EmailBlock,
  type PlaceholderSettings,
} from "./email-blocks";

/**
 * The automatic emails the site sends by itself. Each entry has a default wording;
 * the admin can change it under Settings > Email templates. To add another automatic
 * email, add an entry here and send it with `buildSystemEmail`.
 */
export type SystemEmail = {
  key: string;
  name: string;
  description: string;
  when: string;
  subject: string;
  blocks: EmailBlock[];
  /** Whether the shared email footer is added by default. */
  footer: boolean;
  /** Merge fields that must appear in the subject or body, or the email would be useless. */
  required: string[];
  /** Merge fields this email fills in (besides the ones every email has). */
  fields: string[];
};
export type SavedSystemEmail = {
  subject: string;
  blocks: EmailBlock[];
  footer: boolean;
  updatedAt: string;
};

const text = (id: string, html: string): EmailBlock => ({
  id,
  type: "text",
  html,
});
const signoff = text("signoff", "Warmly,<br>Sibel’s team");

export const systemEmails: SystemEmail[] = [
  {
    key: "set-password",
    name: "Set your password",
    description:
      "Lets a member choose their first password, or a new one when Sibel’s team sends them the link.",
    when: "Sent when the admin adds a new member, and when the admin presses “Send password link by email” on a member.",
    subject: "Set your password for {{site_name}}",
    blocks: [
      text("hello", "Hello {{first_name}},"),
      text(
        "intro",
        "Sibel’s team has set up your place in {{site_name}}. Use the button to choose your password.",
      ),
      {
        id: "button",
        type: "button",
        label: "Set my password",
        href: "{{link}}",
      },
      text("paste", "Or paste this link into your browser:<br>{{link}}"),
      {
        id: "once",
        type: "note",
        html: "The link can be used once. If it stops working, choose “Forgot your password?” on the login page and we will send you a new one.",
      },
      signoff,
    ],
    footer: false,
    required: ["link"],
    fields: ["first_name", "name", "email", "link", "site_name", "site_url"],
  },
  {
    key: "reset-password",
    name: "Reset your password",
    description:
      "Sent to someone who asks for a new password with “Forgot your password?” on the login page.",
    when: "Sent only when a member asks for it themselves; at most one a minute.",
    subject: "Reset your password for {{site_name}}",
    blocks: [
      text("hello", "Hello {{first_name}},"),
      text(
        "intro",
        "We received a request to choose a new password for your account. Use the button to set it.",
      ),
      {
        id: "button",
        type: "button",
        label: "Choose a new password",
        href: "{{link}}",
      },
      text("paste", "Or paste this link into your browser:<br>{{link}}"),
      {
        id: "once",
        type: "note",
        html: "The link can be used once. If you did not ask for it, you can ignore this email; your password stays as it is.",
      },
      signoff,
    ],
    footer: false,
    required: ["link"],
    fields: ["first_name", "name", "email", "link", "site_name", "site_url"],
  },
];
export const findSystemEmail = (key: string) =>
  systemEmails.find((email) => email.key === key);

/** The saved wording of an email, or its default. */
export function resolveSystemEmail(
  key: string,
  saved?: Record<string, SavedSystemEmail>,
) {
  const base = findSystemEmail(key);
  if (!base) throw new Error("Unknown email.");
  const own = saved?.[key];
  return {
    subject: own?.subject ?? base.subject,
    blocks: own?.blocks ?? base.blocks,
    footer: own?.footer ?? base.footer,
    saved: !!own,
  };
}

/** Which required merge fields are missing from the subject and blocks. */
export function missingFields(
  key: string,
  subject: string,
  blocks: EmailBlock[],
) {
  const all = subject + JSON.stringify(blocks);
  return (findSystemEmail(key)?.required ?? []).filter(
    (field) => !all.includes(`{{${field}}}`),
  );
}

const entities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};
/** A plain-text version of the email HTML, for mail apps that do not show HTML. */
export function htmlToText(html: string) {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(
      /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_m, href, label) => {
        const words = String(label)
          .replace(/<[^>]+>/g, "")
          .trim();
        return !words || words === href ? href : `${words} (${href})`;
      },
    )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|tr|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => entities[match])
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type SystemEmailValues = {
  name?: string;
  email?: string;
  link: string;
};
/** Fills in an email: subject, HTML and plain text. `footer` is the shared footer blocks. */
export function buildSystemEmail(
  template: { subject: string; blocks: EmailBlock[]; footer: boolean },
  footer: EmailBlock[] | undefined,
  values: SystemEmailValues,
  context: { origin: string; settings?: PlaceholderSettings },
) {
  const full = (values.name ?? "").trim();
  const first = full.split(/\s+/)[0] || "there";
  const make = (escapeValues: boolean) => {
    const wrap = escapeValues ? escapeHtml : (value: string) => value;
    return {
      origin: context.origin,
      name: wrap(full || "there"),
      settings: context.settings,
      values: {
        first_name: wrap(first),
        email: wrap(values.email ?? ""),
        link: values.link,
        site_url: context.origin,
        site_name: wrap(
          context.settings?.siteTitle || "Morning Coffee Community",
        ),
      },
    };
  };
  const html = fillPlaceholders(
    renderEmail(template.blocks, template.footer ? footer : undefined),
    make(true),
  );
  return {
    subject: fillPlaceholders(template.subject, make(false)).replace(
      /[\r\n]+/g,
      " ",
    ),
    html,
    text: htmlToText(html),
  };
}
