import {
  useActionState,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { adminMutation } from "@/lib/actions";
import { defaultEmailFooter, emailTemplates } from "@/lib/email-templates";
import {
  blockCatalog,
  fillPlaceholders,
  renderEmail,
  withNewIds,
  type EmailBlock,
  type SavedEmailTemplate,
} from "@/lib/email-blocks";
import type { MediaItem } from "@/lib/site-images";
import type { EmailQuota } from "@/lib/email-quota";
import { Icon } from "./admin-icons";
import type { ActionResult } from "./action-form";
import {
  BlockList,
  Modal,
  Palette,
  cleanPreview,
  displayHtml,
  insertAfter,
  useMutation,
} from "./block-editor";

const noSubscribe = () => () => {};
type Recipient = { id: string; name: string; email: string; tier: string };
function FooterEditor({
  footer,
  media,
  onClose,
}: {
  footer: EmailBlock[];
  media: MediaItem[];
  onClose: (message?: string) => void;
}) {
  const [blocks, setBlocks] = useState(footer);
  const [selected, setSelected] = useState<string>();
  const { pending, feedback, run } = useMutation();
  return (
    <Modal title="Common email footer" onClose={() => onClose()} wide>
      <div className="footer-editor">
        <aside>
          <p className="hint-small">
            Added to the bottom of every email that includes the common footer.
          </p>
          <Palette
            types={[
              "text",
              "note",
              "divider",
              "button",
              "image",
              "spacer",
              "heading",
              "html",
            ]}
            onAdd={(block) => {
              setBlocks(insertAfter(blocks, selected, block));
              setSelected(block.id);
            }}
          />
        </aside>
        <div className="email-stage">
          <div className="email-card footer-card">
            <BlockList
              blocks={blocks}
              onChange={setBlocks}
              selected={selected}
              onSelect={setSelected}
              media={media}
              label="Footer blocks"
            />
          </div>
        </div>
      </div>
      <footer className="media-picker-foot">
        {feedback && !feedback.ok ? (
          <p className="form-feedback error" role="status">
            {feedback.message}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginRight: "auto" }}
          onClick={() => setBlocks(withNewIds(defaultEmailFooter))}
        >
          Use the original footer
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onClose()}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn"
          disabled={pending}
          onClick={async () => {
            const result = await run({
              entity: "emailFooter",
              blocks: JSON.stringify(blocks),
            });
            if (result.ok) onClose(result.message);
          }}
        >
          {pending ? "Saving…" : "Save footer"}
        </button>
      </footer>
    </Modal>
  );
}

type Loaded = { kind: "builtin" | "saved"; id: string };
export function AnnouncementComposer({
  members,
  media,
  templates,
  footer,
  initialRecipients = [],
  quota,
  draft,
}: {
  initialRecipients?: string[];
  quota: EmailQuota;
  /** A ready-made email, e.g. from "Send notification" on a post or episode. */
  draft?: { subject: string; blocks: EmailBlock[]; groups: string[] };
  members: Recipient[];
  media: MediaItem[];
  templates: SavedEmailTemplate[];
  footer: EmailBlock[];
}) {
  const first = draft
    ? { id: "", subject: draft.subject, blocks: draft.blocks, footer: true }
    : emailTemplates[0];
  const [selectedMembers, setSelectedMembers] = useState<string[]>(initialRecipients),
    [groups, setGroups] = useState<string[]>(draft?.groups ?? []);
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState(""),
    [highlight, setHighlight] = useState(0);
  const [subject, setSubject] = useState(first.subject);
  const [blocks, setBlocks] = useState<EmailBlock[]>(() =>
    withNewIds(first.blocks),
  );
  const [footerOn, setFooterOn] = useState(first.footer);
  const [loaded, setLoaded] = useState<Loaded>({
    kind: "builtin",
    id: first.id,
  });
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(first.blocks.map((b) => ({ ...b, id: "" }))),
  );
  const [selected, setSelected] = useState<string>();
  const [mode, setMode] = useState<"blocks" | "html">("blocks");
  const [code, setCode] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFooter, setEditingFooter] = useState(false);
  // DOMPurify needs the browser, so the footer preview appears after hydration.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const [templateName, setTemplateName] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const templateMutation = useMutation();
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    (previous, form) => adminMutation(previous, form),
    { message: "" },
  );
  const rendered = renderEmail(blocks, footerOn ? footer : undefined);
  const html = code ?? rendered;
  const dirty =
    JSON.stringify(blocks.map((b) => ({ ...b, id: "" }))) !== baseline ||
    code !== null;
  const savedTemplate =
    loaded.kind === "saved"
      ? templates.find((t) => t.id === loaded.id)
      : undefined;

  const matches = members
    .filter(
      (m) =>
        !selectedMembers.includes(m.id) &&
        `${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, query ? 8 : 50);
  const count = members.filter(
    (m) =>
      selectedMembers.includes(m.id) ||
      groups.includes("all") ||
      groups.includes(m.tier),
  ).length;
  const add = (id: string) => {
    setSelectedMembers((previous) => [...new Set([...previous, id])]);
    setQuery("");
    setHighlight(0);
    search.current?.focus();
  };
  const load = (
    next: { subject: string; blocks: readonly EmailBlock[]; footer: boolean },
    which: Loaded,
  ) => {
    if (
      dirty &&
      !window.confirm(
        "Replace the current email with this template? Your changes will be lost.",
      )
    )
      return;
    setSubject(next.subject);
    setBlocks(withNewIds(next.blocks));
    setFooterOn(next.footer);
    setLoaded(which);
    setBaseline(JSON.stringify(next.blocks.map((b) => ({ ...b, id: "" }))));
    setCode(null);
    setMode("blocks");
    setSelected(undefined);
  };
  const changeMode = (next: "blocks" | "html") => {
    if (next === mode) return;
    if (next === "blocks" && code !== null) {
      if (
        !window.confirm(
          "Turn your edited code into one HTML block? The footer switch will be turned off because the code already includes it.",
        )
      )
        return;
      setBlocks([
        {
          ...blockCatalog.find((b) => b.type === "html")!.create(),
          html: code,
        },
      ]);
      setFooterOn(false);
      setCode(null);
    }
    setMode(next);
  };
  const saveTemplate = async (asNew: boolean) => {
    const result = await templateMutation.run({
      entity: "emailTemplates",
      id: asNew ? "" : (savedTemplate?.id ?? ""),
      name: templateName,
      subject,
      blocks: JSON.stringify(blocks),
      footer: footerOn ? "on" : "",
    });
    if (result.ok) {
      setSaving(false);
      if (result.id) setLoaded({ kind: "saved", id: result.id });
      setBaseline(JSON.stringify(blocks.map((b) => ({ ...b, id: "" }))));
    }
  };
  const previewHtml = preview
    ? displayHtml(
        fillPlaceholders(cleanPreview(html), {}),
        media,
      )
    : "";

  return (
    <form
      action={action}
      className="composer panel"
      onKeyDown={(event) => {
        // Enter in a block or dialog field must not publish the announcement.
        const target = event.target as HTMLInputElement;
        if (event.key === "Enter" && target.tagName === "INPUT" && !target.name)
          event.preventDefault();
      }}
    >
      <input type="hidden" name="entity" value="announcements" />
      <input name="html" type="hidden" value={html} />
      <div className="composer-heading">
        <span className="pill">A note from Sibel</span>
        <h2>New announcement</h2>
        <p>
          Build the email from blocks, then send it to members’ accounts and
          inboxes.
        </p>
      </div>
      <fieldset className="recipient-field">
        <legend>Send to</legend>
        <div className="recipient-chips">
          {groups.map((group) => (
            <span className="recipient-chip group-chip" key={group}>
              @{group}
              <button
                type="button"
                aria-label={`Remove @${group}`}
                onClick={() => setGroups(groups.filter((g) => g !== group))}
              >
                ×
              </button>
              <input name="groups" type="hidden" value={group} />
            </span>
          ))}
          {selectedMembers.map((id) => {
            const m = members.find((m) => m.id === id)!;
            return (
              <span className="recipient-chip" key={id}>
                {m.name}
                <button
                  type="button"
                  aria-label={`Remove ${m.name}`}
                  onClick={() =>
                    setSelectedMembers(selectedMembers.filter((x) => x !== id))
                  }
                >
                  ×
                </button>
                <input name="recipients" type="hidden" value={id} />
              </span>
            );
          })}
        </div>
        <div className="recipient-search">
          <input
            ref={search}
            role="combobox"
            aria-label="Add registered members"
            aria-controls="recipient-options"
            aria-expanded={listOpen}
            aria-autocomplete="list"
            aria-activedescendant={
              listOpen && matches[highlight]
                ? `recipient-${matches[highlight].id}`
                : undefined
            }
            placeholder="Type a member’s name or email…"
            value={query}
            onFocus={() => setListOpen(true)}
            onClick={() => setListOpen(true)}
            onBlur={() => setListOpen(false)}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setListOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((i) => Math.min(i + 1, matches.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (listOpen && matches[highlight]) add(matches[highlight].id);
              }
              if (e.key === "Escape") {
                setQuery("");
                setListOpen(false);
              }
            }}
          />
          {listOpen ? (
            <div
              id="recipient-options"
              role="listbox"
              aria-label="Matching members"
              className="recipient-options"
            >
              {matches.length ? (
                matches.map((m, index) => (
                  <button
                    type="button"
                    id={`recipient-${m.id}`}
                    role="option"
                    aria-selected={index === highlight}
                    key={m.id}
                    // Keep focus in the search so the list stays open for more picks.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(m.id)}
                  >
                    <span className="avatar">
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span>
                      <b>{m.name}</b>
                      <small>{m.email}</small>
                    </span>
                    <span className={`badge b-${m.tier}`}>{m.tier}</span>
                  </button>
                ))
              ) : (
                <p>
                  No registered member found. External addresses cannot be
                  added.
                </p>
              )}
            </div>
          ) : null}
        </div>
        <div className="group-shortcuts">
          {["all", "free", "premium"].map((group) => (
            <button
              type="button"
              className={`group-shortcut ${groups.includes(group) ? "on" : ""}`}
              key={group}
              aria-pressed={groups.includes(group)}
              onClick={() =>
                setGroups(
                  groups.includes(group)
                    ? groups.filter((g) => g !== group)
                    : [...groups, group],
                )
              }
            >
              @{group}
            </button>
          ))}
          <span className="recipient-count" aria-live="polite">
            {count} unique recipient{count === 1 ? "" : "s"}
          </span>
        </div>
        <div
          className={`quota-meter${count > quota.left ? " over" : ""}`}
          aria-live="polite"
        >
          <span className="quota-bar" aria-hidden="true">
            <i
              style={{
                width: `${Math.min(100, (quota.sent / quota.limit) * 100)}%`,
              }}
            />
            <i
              className="quota-pending"
              style={{
                width: `${Math.min(100 - Math.min(100, (quota.sent / quota.limit) * 100), (count / quota.limit) * 100)}%`,
              }}
            />
          </span>
          <span>
            <b>
              {quota.sent} of {quota.limit}
            </b>{" "}
            emails sent today · {quota.left} left
          </span>
          {count > quota.left ? (
            <span className="quota-error" role="alert">
              This email would go to {count} people, but only {quota.left} of
              today’s {quota.limit} emails are left. Choose fewer recipients or
              send the rest tomorrow.
            </span>
          ) : null}
        </div>
        <p className="hint">
          Registered members only. A person selected individually and through a
          group receives one message.
        </p>
      </fieldset>
      <label className="field">
        Subject
        <input
          name="subject"
          required
          maxLength={250}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </label>

      <section className="builder" aria-label="Email builder">
        <aside className="builder-side">
          <h3>Add a block</h3>
          <Palette
            onAdd={(block) => {
              if (mode === "html") changeMode("blocks");
              setBlocks((current) => insertAfter(current, selected, block));
              setSelected(block.id);
            }}
          />
          <h3>Templates</h3>
          <ul className="template-list" aria-label="Templates">
            {emailTemplates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  aria-pressed={loaded.kind === "builtin" && loaded.id === t.id}
                  onClick={() => load(t, { kind: "builtin", id: t.id })}
                >
                  <b>{t.name}</b>
                  <small>{t.description}</small>
                </button>
              </li>
            ))}
          </ul>
          <h4 className="template-sub">Your templates</h4>
          {templates.length ? (
            <ul className="template-list" aria-label="Your templates">
              {templates.map((t) => (
                <li key={t.id} className="saved">
                  <button
                    type="button"
                    aria-pressed={loaded.kind === "saved" && loaded.id === t.id}
                    onClick={() => load(t, { kind: "saved", id: t.id })}
                  >
                    <b>{t.name}</b>
                    <small>
                      Saved{" "}
                      {new Date(t.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                  </button>
                  <button
                    type="button"
                    className="template-delete"
                    aria-label={`Delete template ${t.name}`}
                    title="Delete template"
                    onClick={async () => {
                      if (!window.confirm(`Delete the template “${t.name}”?`))
                        return;
                      await templateMutation.run({
                        entity: "emailTemplates",
                        op: "remove",
                        id: t.id,
                      });
                      if (loaded.kind === "saved" && loaded.id === t.id)
                        setLoaded({ kind: "builtin", id: "" });
                    }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint-small">
              Save an email as a template to reuse it here.
            </p>
          )}
        </aside>

        <div className="builder-main">
          <div className="builder-toolbar">
            <div
              className="segmented small"
              role="group"
              aria-label="Editor mode"
            >
              <button
                type="button"
                aria-pressed={mode === "blocks"}
                onClick={() => changeMode("blocks")}
              >
                Blocks
              </button>
              <button
                type="button"
                aria-pressed={mode === "html"}
                onClick={() => changeMode("html")}
              >
                HTML code
              </button>
            </div>
            <span className="builder-spacer" />
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setPreview(!preview)}
            >
              <Icon name="eye" size={15} />{" "}
              {preview ? "Hide preview" : "Preview email"}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setTemplateName(savedTemplate?.name ?? subject);
                templateMutation.setFeedback(null);
                setSaving(true);
              }}
            >
              <Icon name="save" size={15} /> Save as template
            </button>
          </div>
          {templateMutation.feedback?.message && !saving ? (
            <p
              className={`form-feedback ${templateMutation.feedback.ok ? "success" : "error"}`}
              role="status"
            >
              {templateMutation.feedback.message}
            </p>
          ) : null}
          {mode === "blocks" ? (
            <div className="email-stage">
              <div className="email-card">
                <BlockList
                  blocks={blocks}
                  onChange={setBlocks}
                  selected={selected}
                  onSelect={setSelected}
                  media={media}
                  label="Email blocks"
                />
                {footerOn && mounted ? (
                  <div className="email-footer-preview">
                    <span className="footer-tag">Common footer</span>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: displayHtml(
                          cleanPreview(renderEmail([], footer)),
                          media,
                        ),
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              {code !== null ? (
                <p className="hint code-note">
                  You are editing the code directly. Switching back to Blocks
                  turns it into one HTML block.
                </p>
              ) : null}
              <textarea
                className="html-source"
                aria-label="Message HTML code"
                value={html}
                rows={24}
                maxLength={150000}
                spellCheck={false}
                onChange={(e) => setCode(e.target.value)}
              />
            </>
          )}
          <div className="footer-row">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={footerOn}
                disabled={code !== null}
                onChange={(e) => setFooterOn(e.target.checked)}
              />
              Include the common footer
            </label>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setEditingFooter(true)}
            >
              Edit footer
            </button>
          </div>
          <p className="hint">
            Type {"{{"} in any text, title, button or link to insert a merge
            field, such as the member’s first name or a link to their account.
            Unsafe code is removed when published.
          </p>
        </div>
      </section>

      {preview ? (
        <iframe
          title="Email preview"
          className="email-preview"
          sandbox="allow-same-origin"
          srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f5efe9}img{max-width:100%}table{max-width:100%}</style></head><body>${previewHtml}</body></html>`}
        />
      ) : null}
      <div className="composer-actions">
        <button
          className="btn"
          disabled={pending || !count || count > quota.left}
        >
          {pending ? "Preparing…" : "Publish & prepare email"}
        </button>
      </div>
      <p className="composer-delivery-note">
        Your announcement appears only in the selected members’ accounts. An
        individual email draft is prepared for each recipient. Email delivery is
        not connected in this review.
      </p>
      {state.message ? (
        <p
          className={`form-feedback ${state.ok ? "success" : "error"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      {saving ? (
        <Modal
          title={savedTemplate ? "Save template" : "Save as template"}
          onClose={() => setSaving(false)}
        >
          <div className="save-template">
            <label className="field">
              Template name
              <input
                autoFocus
                value={templateName}
                maxLength={80}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </label>
            <p className="hint-small">
              Saves the subject, blocks and footer setting. Recipients are not
              saved.
            </p>
            {templateMutation.feedback && !templateMutation.feedback.ok ? (
              <p className="form-feedback error" role="status">
                {templateMutation.feedback.message}
              </p>
            ) : null}
          </div>
          <footer className="media-picker-foot">
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginRight: "auto" }}
              onClick={() => setSaving(false)}
            >
              Cancel
            </button>
            {savedTemplate ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={templateMutation.pending || !templateName.trim()}
                onClick={() => saveTemplate(true)}
              >
                Save as new
              </button>
            ) : null}
            <button
              type="button"
              className="btn"
              disabled={templateMutation.pending || !templateName.trim()}
              onClick={() => saveTemplate(!savedTemplate)}
            >
              {savedTemplate
                ? `Update “${savedTemplate.name}”`
                : "Save template"}
            </button>
          </footer>
        </Modal>
      ) : null}
      {editingFooter ? (
        <FooterEditor
          footer={footer}
          media={media}
          onClose={(message) => {
            setEditingFooter(false);
            if (message) templateMutation.setFeedback({ ok: true, message });
          }}
        />
      ) : null}
    </form>
  );
}
