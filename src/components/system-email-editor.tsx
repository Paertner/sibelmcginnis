"use client";
import { useState } from "react";
import {
  blockTypes,
  fillPlaceholders,
  placeholders,
  renderEmail,
  withNewIds,
  type EmailBlock,
  type PlaceholderSettings,
} from "@/lib/email-blocks";
import type { MediaItem } from "@/lib/site-images";
import {
  BlockList,
  Palette,
  SystemFieldsContext,
  cleanPreview,
  displayHtml,
  insertAfter,
  useMutation,
} from "./block-editor";
import { askConfirm } from "./confirm-dialog";
import { Notify } from "./toast";

export type SystemEmailItem = {
  key: string;
  name: string;
  description: string;
  when: string;
  fields: string[];
  defaults: { subject: string; blocks: EmailBlock[]; footer: boolean };
  current: {
    subject: string;
    blocks: EmailBlock[];
    footer: boolean;
    saved: boolean;
  };
};

const sample: Record<string, string> = {
  first_name: "Amelia",
  name: "Amelia Hart",
  email: "amelia@example.com",
  link: "https://example.com/reset-password?token_hash=example",
};

function Editor({
  item,
  footer,
  media,
  settings,
  live,
}: {
  item: SystemEmailItem;
  footer: EmailBlock[];
  media: MediaItem[];
  settings: PlaceholderSettings;
  live: boolean;
}) {
  const [subject, setSubject] = useState(item.current.subject);
  const [blocks, setBlocks] = useState(() => withNewIds(item.current.blocks));
  const [footerOn, setFooterOn] = useState(item.current.footer);
  const [selected, setSelected] = useState<string>();
  const mutation = useMutation();
  const html = renderEmail(blocks, footerOn ? footer : undefined);
  const siteName = settings.siteTitle || "Morning Coffee Community";
  const preview = displayHtml(
    fillPlaceholders(cleanPreview(html), { settings, values: sample }),
    media,
  );
  const shownSubject = subject.replace(
    /\{\{(\w+)\}\}/g,
    (match, key: string) =>
      sample[key] ?? (key === "site_name" ? siteName : match),
  );
  const fields = {
    entity: "systemEmails",
    key: item.key,
    subject,
    blocks: JSON.stringify(blocks),
    footer: footerOn ? "on" : "",
  };
  const usable = placeholders.filter((field) =>
    item.fields.includes(field.key),
  );
  return (
    <section className="panel system-email" aria-label={item.name}>
      <h3>{item.name}</h3>
      <p className="muted">{item.description}</p>
      <p className="hint">{item.when}</p>
      <label className="field">
        Subject
        <input
          value={subject}
          maxLength={250}
          onChange={(event) => setSubject(event.target.value)}
        />
      </label>
      <p className="hint">
        Merge fields you can use here (type {"{{"} in any text to pick one):{" "}
        {usable.map((field, index) => (
          <span key={field.key}>
            {index ? ", " : ""}
            <code title={field.label}>{`{{${field.key}}}`}</code>
          </span>
        ))}
        . The link field is required.
      </p>
      <div className="blocks-field-head">
        <span className="blocks-field-label">Message</span>
        <Palette
          compact
          types={blockTypes.filter((type) => type !== "header")}
          onAdd={(block) => {
            setBlocks(insertAfter(blocks, selected, block));
            setSelected(block.id);
          }}
        />
      </div>
      <SystemFieldsContext.Provider value={true}>
        <div className="email-stage article-stage">
          <div className="email-card article-canvas">
            <BlockList
              blocks={blocks}
              onChange={setBlocks}
              selected={selected}
              onSelect={setSelected}
              media={media}
              label={`${item.name} message`}
            />
          </div>
        </div>
      </SystemFieldsContext.Provider>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={footerOn}
          onChange={(event) => setFooterOn(event.target.checked)}
        />
        Include the shared footer
      </label>
      <h4>Preview</h4>
      <p className="hint">
        Subject: <b>{shownSubject}</b>
      </p>
      <iframe
        title={`${item.name} preview`}
        className="email-preview"
        sandbox="allow-same-origin"
        srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f5efe9}img{max-width:100%}table{max-width:100%}</style></head><body>${preview}</body></html>`}
      />
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={mutation.pending || !item.current.saved}
          onClick={async () => {
            if (
              !(await askConfirm("Your changes to this email are removed.", {
                title: "Go back to the default wording?",
                confirmLabel: "Yes, reset it",
              }))
            )
              return;
            const result = await mutation.run({
              entity: "systemEmails",
              op: "reset",
              key: item.key,
            });
            if (result.ok) {
              setSubject(item.defaults.subject);
              setBlocks(withNewIds(item.defaults.blocks));
              setFooterOn(item.defaults.footer);
            }
          }}
        >
          Reset to default
        </button>
        <span className="form-actions-gap" />
        <button
          type="button"
          className="btn btn-ghost"
          disabled={mutation.pending || !live}
          title={live ? undefined : "Available on the live site"}
          onClick={() => mutation.run({ ...fields, op: "test" })}
        >
          Send test to me
        </button>
        <button
          type="button"
          className="btn"
          disabled={mutation.pending}
          onClick={() => mutation.run({ ...fields, op: "save" })}
        >
          {mutation.pending ? "Saving…" : "Save"}
        </button>
      </div>
      <Notify result={mutation.feedback} />
    </section>
  );
}

/** Settings > Email templates: the automatic emails the site sends, editable like announcements. */
export function SystemEmailsTab({
  items,
  footer,
  media,
  settings,
  live,
}: {
  items: SystemEmailItem[];
  footer: EmailBlock[];
  media: MediaItem[];
  settings: PlaceholderSettings;
  live: boolean;
}) {
  const [open, setOpen] = useState<string>();
  const current = items.find((item) => item.key === open);
  return (
    <div className="system-emails">
      <p className="settings-warning">
        These emails are sent automatically, only when something happens (for
        example, a member is added). Change the wording here; the sender, daily
        limit and Resend key are under Integrations.
      </p>
      <ul className="system-email-list">
        {items.map((item) => (
          <li key={item.key} className="panel">
            <div>
              <b>{item.name}</b>{" "}
              {item.current.saved ? (
                <span className="badge b-ok">Customised</span>
              ) : (
                <span className="badge b-grey">Default wording</span>
              )}
              <p className="muted">{item.description}</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              aria-expanded={open === item.key}
              onClick={() => setOpen(open === item.key ? undefined : item.key)}
            >
              {open === item.key ? "Close" : "Edit"}
            </button>
          </li>
        ))}
      </ul>
      {current ? (
        <Editor
          key={current.key}
          item={current}
          footer={footer}
          media={media}
          settings={settings}
          live={live}
        />
      ) : null}
    </div>
  );
}
