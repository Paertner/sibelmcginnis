import {
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import DOMPurify from "dompurify";
import { adminMutation } from "@/lib/actions";
import { defaultEmailFooter, emailTemplates } from "@/lib/email-templates";
import {
  blockCatalog,
  formatHtml,
  renderEmail,
  withNewIds,
  type BlockType,
  type EmailBlock,
  type SavedEmailTemplate,
} from "@/lib/email-blocks";
import type { MediaItem } from "@/lib/site-images";
import { Icon, type IconName } from "./admin-icons";
import { MediaPicker } from "./media-library";
import type { ActionResult } from "./action-form";

const noSubscribe = () => () => {};
type Recipient = { id: string; name: string; email: string; tier: string };
const blockIcons: Record<BlockType, IconName> = {
  header: "layout",
  heading: "heading",
  text: "notes",
  image: "image",
  button: "link",
  quote: "quote",
  divider: "minus",
  spacer: "spacer",
  note: "fine",
  html: "code",
};
const labelOf = (type: BlockType) =>
  blockCatalog.find((entry) => entry.type === type)!.label;
const cleanRich = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b",
      "strong",
      "i",
      "em",
      "u",
      "a",
      "br",
      "ul",
      "ol",
      "li",
      "p",
      "span",
    ],
    ALLOWED_ATTR: ["href", "style"],
  });
const cleanPreview = (html: string) =>
  DOMPurify.sanitize(html, {
    FORBID_TAGS: [
      "style",
      "script",
      "form",
      "input",
      "button",
      "iframe",
      "object",
      "embed",
    ],
    FORBID_ATTR: ["srcset"],
  });

/** Shows stored image paths with the address this browser can load. */
const displayHtml = (html: string, media: MediaItem[]) =>
  media.reduce(
    (out, item) =>
      item.src === item.path ? out : out.replaceAll(item.path, item.src),
    html,
  );

function RichText({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  label: string;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (
      element &&
      document.activeElement !== element &&
      element.innerHTML !== value
    )
      element.innerHTML = value;
  }, [value]);
  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline="true"
      aria-label={label}
      contentEditable
      suppressContentEditableWarning
      className={`rich ${className}`}
      onInput={(event) => onChange(event.currentTarget.innerHTML)}
      onBlur={(event) => onChange(cleanRich(event.currentTarget.innerHTML))}
      onPaste={(event) => {
        event.preventDefault();
        document.execCommand(
          "insertText",
          false,
          event.clipboardData.getData("text/plain"),
        );
      }}
    />
  );
}

// Formatting applies to the text block that has focus.
function format(command: string, value?: string) {
  document.execCommand(command, false, value);
  document.activeElement?.dispatchEvent(new Event("input", { bubbles: true }));
}
const richTypes: BlockType[] = ["text", "quote", "note"];

function BlockEditor({
  block,
  index,
  count,
  selected,
  media,
  onSelect,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  onPickImage,
}: {
  block: EmailBlock;
  index: number;
  count: number;
  selected: boolean;
  media: MediaItem[];
  onSelect: () => void;
  onChange: (patch: Partial<EmailBlock>) => void;
  onMove: (step: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onPickImage: () => void;
}) {
  const imageSrc =
    media.find((item) => item.path === block.path)?.src ?? block.path;
  return (
    <div
      className={`blk blk-${block.type}${selected ? " on" : ""}`}
      onFocusCapture={onSelect}
      onClick={onSelect}
    >
      {selected ? (
        <div
          className="blk-bar"
          role="toolbar"
          aria-label={`${labelOf(block.type)} block`}
        >
          <span className="blk-name">
            <Icon name={blockIcons[block.type]} size={14} />
            {labelOf(block.type)}
          </span>
          {richTypes.includes(block.type) ? (
            <span className="blk-format">
              {(
                [
                  ["bold", "B", "Bold"],
                  ["italic", "I", "Italic"],
                  ["insertUnorderedList", "•", "Bulleted list"],
                ] as const
              ).map(([command, text, label]) => (
                <button
                  key={command}
                  type="button"
                  aria-label={label}
                  title={label}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => format(command)}
                >
                  {text}
                </button>
              ))}
              <button
                type="button"
                title="Add a link"
                aria-label="Add a link"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const url = window.prompt("Link address (https://…)");
                  if (url) format("createLink", url);
                }}
              >
                <Icon name="link" size={14} />
              </button>
              <button
                type="button"
                title="Insert the member’s first name"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => format("insertText", "{{first_name}}")}
              >
                First name
              </button>
            </span>
          ) : null}
          <span className="blk-actions">
            <button
              type="button"
              aria-label="Move block up"
              title="Move up"
              disabled={!index}
              onClick={() => onMove(-1)}
            >
              <Icon name="up" size={15} />
            </button>
            <button
              type="button"
              aria-label="Move block down"
              title="Move down"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            >
              <Icon name="down" size={15} />
            </button>
            <button
              type="button"
              aria-label="Duplicate block"
              title="Duplicate"
              onClick={onDuplicate}
            >
              <Icon name="copy" size={15} />
            </button>
            <button
              type="button"
              aria-label="Delete block"
              title="Delete"
              className="danger"
              onClick={onRemove}
            >
              <Icon name="trash" size={15} />
            </button>
          </span>
        </div>
      ) : null}
      {block.type === "header" ? (
        <div className="blk-header-body">
          <input
            className="blk-eyebrow"
            aria-label="Header label"
            value={block.eyebrow ?? ""}
            onChange={(event) => onChange({ eyebrow: event.target.value })}
          />
          <textarea
            className="blk-title"
            aria-label="Header title"
            rows={2}
            value={block.title ?? ""}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </div>
      ) : null}
      {block.type === "heading" ? (
        <input
          className="blk-heading-input"
          aria-label="Heading"
          value={block.text ?? ""}
          onChange={(event) => onChange({ text: event.target.value })}
        />
      ) : null}
      {richTypes.includes(block.type) ? (
        <RichText
          className={`blk-${block.type}-text`}
          label={labelOf(block.type)}
          value={block.html ?? ""}
          onChange={(html) => onChange({ html })}
        />
      ) : null}
      {block.type === "image" ? (
        block.path ? (
          <div className="blk-image-body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt={block.alt ?? ""} />
            {selected ? (
              <div className="blk-fields">
                <label>
                  Description
                  <input
                    value={block.alt ?? ""}
                    onChange={(event) => onChange({ alt: event.target.value })}
                  />
                </label>
                <label>
                  Link (optional)
                  <input
                    value={block.href ?? ""}
                    placeholder="https://"
                    onChange={(event) => onChange({ href: event.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={onPickImage}
                >
                  <Icon name="image" size={15} /> Replace image
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="blk-image-empty"
            onClick={onPickImage}
          >
            <Icon name="image" size={26} />
            Choose an image
          </button>
        )
      ) : null}
      {block.type === "button" ? (
        <div className="blk-button-body">
          <input
            className="blk-button-label"
            aria-label="Button text"
            value={block.label ?? ""}
            onChange={(event) => onChange({ label: event.target.value })}
          />
          {selected ? (
            <label className="blk-inline-field">
              Opens
              <input
                aria-label="Button link"
                value={block.href ?? ""}
                onChange={(event) => onChange({ href: event.target.value })}
              />
            </label>
          ) : null}
        </div>
      ) : null}
      {block.type === "divider" ? <div className="blk-divider-line" /> : null}
      {block.type === "spacer" ? (
        <div className={`blk-spacer-body size-${block.size ?? "medium"}`}>
          {selected ? (
            <span className="segmented small" role="group" aria-label="Space">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={(block.size ?? "medium") === size}
                  onClick={() => onChange({ size })}
                >
                  {size}
                </button>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}
      {block.type === "html" ? (
        <textarea
          className="blk-code"
          aria-label="HTML code block"
          spellCheck={false}
          rows={Math.min(
            16,
            Math.max(4, (block.html ?? "").split("\n").length + 1),
          )}
          value={block.html ?? ""}
          onChange={(event) => onChange({ html: event.target.value })}
          onBlur={(event) => onChange({ html: formatHtml(event.target.value) })}
        />
      ) : null}
    </div>
  );
}

function BlockList({
  blocks,
  onChange,
  selected,
  onSelect,
  media,
  label,
}: {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
  selected?: string;
  onSelect: (id?: string) => void;
  media: MediaItem[];
  label: string;
}) {
  const [picking, setPicking] = useState<string>();
  const update = (id: string, patch: Partial<EmailBlock>) =>
    onChange(
      blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    );
  const target = blocks.find((block) => block.id === picking);
  return (
    <div className="blk-list" aria-label={label} role="group">
      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          index={index}
          count={blocks.length}
          selected={selected === block.id}
          media={media}
          onSelect={() => onSelect(block.id)}
          onChange={(patch) => update(block.id, patch)}
          onMove={(step) => {
            const next = [...blocks];
            next.splice(index + step, 0, ...next.splice(index, 1));
            onChange(next);
          }}
          onDuplicate={() => {
            const [copy] = withNewIds([block]);
            const next = [...blocks];
            next.splice(index + 1, 0, copy);
            onChange(next);
            onSelect(copy.id);
          }}
          onRemove={() => {
            onChange(blocks.filter((entry) => entry.id !== block.id));
            onSelect(undefined);
          }}
          onPickImage={() => setPicking(block.id)}
        />
      ))}
      {!blocks.length ? (
        <p className="blk-empty">
          Add blocks from the list to build this email.
        </p>
      ) : null}
      {target ? (
        <MediaPicker
          slot={{
            id: "email",
            group: "Email",
            label: "Image block",
            src: target.path ?? "",
            alt: target.alt ?? "",
            position: "center",
            custom: false,
            fileName: "",
            mediaId: media.find((item) => item.path === target.path)?.id ?? "",
          }}
          media={media}
          framing={false}
          onClose={() => setPicking(undefined)}
          onChoose={({ media: item, alt }) =>
            update(target.id, { path: item.path, mediaId: item.id, alt })
          }
        />
      ) : null}
    </div>
  );
}

function insertAfter(
  blocks: EmailBlock[],
  selected: string | undefined,
  block: EmailBlock,
) {
  const index = blocks.findIndex((entry) => entry.id === selected);
  const next = [...blocks];
  next.splice(index < 0 ? next.length : index + 1, 0, block);
  return next;
}
function Palette({
  onAdd,
  types,
}: {
  onAdd: (block: EmailBlock) => void;
  types?: BlockType[];
}) {
  return (
    <div className="palette">
      {blockCatalog
        .filter((entry) => !types || types.includes(entry.type))
        .map((entry) => (
          <button
            key={entry.type}
            type="button"
            className="palette-item"
            onClick={() => onAdd(entry.create())}
          >
            <Icon name={blockIcons[entry.type]} size={18} />
            <span>
              <b>{entry.label}</b>
              <small>{entry.hint}</small>
            </span>
          </button>
        ))}
    </div>
  );
}

function useMutation() {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<ActionResult | null>(null);
  const run = (fields: Record<string, string>) =>
    new Promise<ActionResult>((resolve) =>
      start(async () => {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields)) form.set(key, value);
        const result = await adminMutation({ message: "" }, form);
        setFeedback(result);
        resolve(result);
      }),
    );
  return { pending, feedback, setFeedback, run };
}
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`composer-modal${wide ? " wide" : ""}`}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="media-picker-head">
        <h3>{title}</h3>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}

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
}: {
  members: Recipient[];
  media: MediaItem[];
  templates: SavedEmailTemplate[];
  footer: EmailBlock[];
}) {
  const first = emailTemplates[0];
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]),
    [groups, setGroups] = useState<string[]>([]);
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
    .slice(0, 6);
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
        cleanPreview(html)
          .replaceAll("{{first_name}}", "Amelia")
          .replaceAll("{{account_url}}", "/account"),
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
            aria-expanded={!!query}
            aria-autocomplete="list"
            aria-activedescendant={
              query && matches[highlight]
                ? `recipient-${matches[highlight].id}`
                : undefined
            }
            placeholder="Type a member’s name or email…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
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
                if (query && matches[highlight]) add(matches[highlight].id);
              }
              if (e.key === "Escape") setQuery("");
            }}
          />
          {query ? (
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
            {"{{first_name}}"} personalizes each email; {"{{account_url}}"}{" "}
            opens the member account. Unsafe code is removed when published.
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
        <button className="btn" disabled={pending || !count}>
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
