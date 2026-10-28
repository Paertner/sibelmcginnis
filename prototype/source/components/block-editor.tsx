import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import DOMPurify from "dompurify";
import { adminMutation } from "@/lib/actions";
import {
  blockCatalog,
  blockLook,
  formatHtml,
  isLinkField,
  placeholders,
  socialNetworks,
  styleControls,
  withNewIds,
  type BlockStyle,
  type BlockType,
  type EmailBlock,
  type StyleKey,
} from "@/lib/email-blocks";
import type { MediaItem } from "@/lib/site-images";
import { Icon, type IconName } from "./admin-icons";
import { MediaPicker } from "./media-library";
import { SocialLogo } from "./social-logo";
import type { ActionResult } from "./action-form";

// Block editing shared by announcement emails, blog posts and session notes.
export const blockIcons: Record<BlockType, IconName> = {
  header: "layout",
  heading: "heading",
  text: "notes",
  image: "image",
  button: "link",
  quote: "quote",
  divider: "minus",
  spacer: "spacer",
  note: "fine",
  social: "share",
  html: "code",
};
export const labelOf = (type: BlockType) =>
  blockCatalog.find((entry) => entry.type === type)!.label;
export const cleanRich = (html: string) =>
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
export const cleanPreview = (html: string) =>
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
export const displayHtml = (html: string, media: MediaItem[]) =>
  media.reduce(
    (out, item) =>
      item.src === item.path ? out : out.replaceAll(item.path, item.src),
    html,
  );

export function RichText({
  value,
  onChange,
  label,
  className,
  style,
  onCaret,
  onKeyDown,
  onLeave,
}: {
  value: string;
  onChange: (html: string) => void;
  label: string;
  className: string;
  style?: React.CSSProperties;
  /** Called after typing, so merge-field suggestions can follow the caret. */
  onCaret?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onLeave?: () => void;
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
      style={style}
      onInput={(event) => {
        onChange(event.currentTarget.innerHTML);
        onCaret?.();
      }}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        onChange(cleanRich(event.currentTarget.innerHTML));
        onLeave?.();
      }}
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
export function format(command: string, value?: string) {
  document.execCommand(command, false, value);
  document.activeElement?.dispatchEvent(new Event("input", { bubbles: true }));
}
export const richTypes: BlockType[] = ["text", "quote", "note"];

const choiceLabels: Partial<Record<StyleKey, [string, string][]>> = {
  align: [
    ["left", "Left"],
    ["center", "Center"],
    ["right", "Right"],
  ],
  fontSize: [
    ["small", "S"],
    ["normal", "M"],
    ["large", "L"],
  ],
  space: [
    ["none", "None"],
    ["small", "S"],
    ["medium", "M"],
    ["large", "L"],
  ],
  width: [
    ["full", "Full"],
    ["wide", "Wide"],
    ["half", "Half"],
  ],
  shape: [
    ["rounded", "Rounded"],
    ["pill", "Pill"],
    ["square", "Square"],
  ],
  thickness: [
    ["thin", "Thin"],
    ["medium", "Medium"],
    ["thick", "Thick"],
  ],
};
function styleLabel(key: StyleKey, type: BlockType) {
  if (key === "accent")
    return (
      { header: "Label color", button: "Button color" } as Record<string, string>
    )[type] ?? "Line color";
  return {
    align: "Alignment",
    fontSize: "Text size",
    color: "Text color",
    background: "Background",
    space: "Space around",
    width: "Width",
    shape: type === "image" ? "Corners" : "Shape",
    thickness: "Thickness",
  }[key];
}

/** Per-block look: shared settings plus the ones only this block type has. */
function StylePanel({
  block,
  onChange,
}: {
  block: EmailBlock;
  onChange: (style: BlockStyle | undefined) => void;
}) {
  const look = blockLook(block);
  const set = (key: StyleKey, value: string | undefined) => {
    const next = { ...block.style, [key]: value } as Record<string, string>;
    if (value === undefined) delete next[key];
    onChange(Object.keys(next).length ? (next as BlockStyle) : undefined);
  };
  return (
    <div className="blk-style" onClick={(event) => event.stopPropagation()}>
      {styleControls[block.type].map((key) => {
        const label = styleLabel(key, block.type);
        if (key === "color" || key === "background" || key === "accent") {
          const current = (look[key] as string | undefined) ?? "#ffffff";
          return (
            <label key={key} className="style-color">
              <span>{label}</span>
              <input
                type="color"
                value={current}
                onChange={(event) => set(key, event.target.value)}
              />
              {block.style?.[key] ? (
                <button
                  type="button"
                  className="style-reset"
                  aria-label={`Reset ${label.toLowerCase()}`}
                  title="Back to default"
                  onClick={() => set(key, undefined)}
                >
                  ×
                </button>
              ) : null}
            </label>
          );
        }
        const options =
          key === "width" && block.type === "button"
            ? [
                ["auto", "Auto"],
                ["full", "Full width"],
              ]
            : (choiceLabels[key] ?? []);
        const value =
          key === "width" && block.type === "button"
            ? block.style?.width === "full"
              ? "full"
              : "auto"
            : (block.style?.[key] ??
              {
                align: look.align,
                fontSize: "normal",
                space: "medium",
                width: "full",
                shape: "rounded",
                thickness: "thin",
              }[key as string]);
        return (
          <div key={key} className="style-choice">
            <span>{label}</span>
            <span className="segmented small" role="group" aria-label={label}>
              {options.map(([option, text]) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={value === option}
                  onClick={() => set(key, option === "auto" ? undefined : option)}
                >
                  {text}
                </button>
              ))}
            </span>
          </div>
        );
      })}
      {block.style ? (
        <button
          type="button"
          className="style-reset-all"
          onClick={() => onChange(undefined)}
        >
          Reset style
        </button>
      ) : null}
    </div>
  );
}

type Suggest = {
  query: string;
  index: number;
  /** Link fields offer only address fields; text offers only words such as names. */
  kind: "link" | "text";
  apply: (key: string) => void;
};
const mergeMatch = (before: string) => before.match(/\{\{([a-z_]*)$/i);
const matchingFields = (query: string, kind: Suggest["kind"]) =>
  placeholders.filter(
    (field) =>
      isLinkField(field) === (kind === "link") &&
      (field.key.startsWith(query.toLowerCase()) ||
        field.label.toLowerCase().includes(query.toLowerCase())),
  );

export function BlockEditor({
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
  const [styling, setStyling] = useState(false);
  const [suggest, setSuggest] = useState<Suggest | null>(null);
  const look = blockLook(block);
  const imageSrc =
    media.find((item) => item.path === block.path)?.src ?? block.path;
  const options = suggest ? matchingFields(suggest.query, suggest.kind) : [];
  const close = () => setSuggest(null);

  // Typing "{{" in a field opens the list of merge fields that can go there.
  const inputSuggest = (
    field: "eyebrow" | "title" | "text" | "label" | "href",
  ) => ({
    onInput: (
      event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const element = event.currentTarget;
      const caret = element.selectionStart ?? element.value.length;
      const match = mergeMatch(element.value.slice(0, caret));
      if (!match) return close();
      setSuggest({
        query: match[1],
        index: 0,
        kind: field === "href" ? "link" : "text",
        apply: (key) => {
          const start = caret - match[0].length;
          const value = `${element.value.slice(0, start)}{{${key}}}${element.value.slice(caret)}`;
          onChange({ [field]: value });
          requestAnimationFrame(() => {
            element.focus();
            const position = start + key.length + 4;
            element.setSelectionRange(position, position);
          });
        },
      });
    },
    onKeyDown: suggestKeys,
    onBlur: () => setTimeout(close, 150),
  });
  const richSuggest = () => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    if (!selection || !node || node.nodeType !== Node.TEXT_NODE) return close();
    const offset = selection.anchorOffset;
    const match = mergeMatch((node.textContent ?? "").slice(0, offset));
    if (!match) return close();
    setSuggest({
      query: match[1],
      index: 0,
      kind: "text",
      apply: (key) => {
        const range = document.createRange();
        range.setStart(node, offset - match[0].length);
        range.setEnd(node, offset);
        selection.removeAllRanges();
        selection.addRange(range);
        format("insertText", `{{${key}}}`);
      },
    });
  };
  function suggestKeys(event: React.KeyboardEvent) {
    if (!suggest || !options.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setSuggest({
        ...suggest,
        index: (suggest.index + step + options.length) % options.length,
      });
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      suggest.apply(options[Math.min(suggest.index, options.length - 1)].key);
      close();
    } else if (event.key === "Escape") close();
  }
  const boxed = look.background
    ? { background: look.background, padding: "14px 18px", borderRadius: 12 }
    : {};

  return (
    <div
      className={`blk blk-${block.type}${selected ? " on" : ""}`}
      onFocusCapture={onSelect}
      onClick={onSelect}
      style={
        block.type === "header"
          ? {
              background: look.background,
              textAlign: look.align,
              paddingTop: look.padding,
              paddingBottom: look.padding,
            }
          : undefined
      }
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
                  const url = window.prompt("Link address (https://… or {{account_url}})");
                  if (url) format("createLink", url);
                }}
              >
                <Icon name="link" size={14} />
              </button>
              <button
                type="button"
                title="Insert the member’s name"
                aria-label="Insert the member’s name"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  format("insertText", "{{");
                  richSuggest();
                }}
              >
                {"{{ }}"}
              </button>
            </span>
          ) : null}
          {styleControls[block.type].length ? (
            <button
              type="button"
              className={`blk-style-toggle${styling ? " on" : ""}`}
              aria-pressed={styling}
              onClick={() => setStyling(!styling)}
            >
              <Icon name="sliders" size={14} /> Style
            </button>
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
      {selected && styling ? (
        <StylePanel block={block} onChange={(style) => onChange({ style })} />
      ) : null}
      {block.type === "header" ? (
        <div className="blk-header-body">
          <input
            className="blk-eyebrow"
            aria-label="Header label"
            value={block.eyebrow ?? ""}
            style={{ color: look.accent, textAlign: look.align }}
            onChange={(event) => onChange({ eyebrow: event.target.value })}
            {...inputSuggest("eyebrow")}
          />
          <textarea
            className="blk-title"
            aria-label="Header title"
            rows={2}
            value={block.title ?? ""}
            style={{ color: look.color, textAlign: look.align }}
            onChange={(event) => onChange({ title: event.target.value })}
            {...inputSuggest("title")}
          />
        </div>
      ) : null}
      {block.type === "heading" ? (
        <div style={{ ...boxed, margin: boxed.background ? "12px 0" : 0 }}>
          <input
            className="blk-heading-input"
            aria-label="Heading"
            value={block.text ?? ""}
            style={{
              color: look.color,
              fontSize: look.fontSize,
              textAlign: look.align,
            }}
            onChange={(event) => onChange({ text: event.target.value })}
            {...inputSuggest("text")}
          />
        </div>
      ) : null}
      {richTypes.includes(block.type) ? (
        <RichText
          className={`blk-${block.type}-text`}
          label={labelOf(block.type)}
          value={block.html ?? ""}
          style={{
            color: look.color,
            fontSize: look.fontSize,
            textAlign: look.align,
            ...(block.type === "quote"
              ? { background: look.background, borderLeftColor: look.accent }
              : boxed),
          }}
          onChange={(html) => onChange({ html })}
          onCaret={richSuggest}
          onKeyDown={suggestKeys}
          onLeave={() => setTimeout(close, 150)}
        />
      ) : null}
      {block.type === "image" ? (
        block.path ? (
          <div className="blk-image-body">
            <div style={{ textAlign: look.align }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={block.alt ?? ""}
                style={{
                  display: "inline-block",
                  width: `${look.width}%`,
                  borderRadius: look.radius,
                }}
              />
            </div>
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
                    placeholder="https:// or {{"
                    onChange={(event) => onChange({ href: event.target.value })}
                    {...inputSuggest("href")}
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
        <div className="blk-button-body" style={{ textAlign: look.align }}>
          <input
            className="blk-button-label"
            aria-label="Button text"
            value={block.label ?? ""}
            style={{
              background: look.accent,
              color: look.color,
              borderRadius: look.radius,
              width: look.fullWidth ? "100%" : undefined,
              textAlign: "center",
            }}
            onChange={(event) => onChange({ label: event.target.value })}
            {...inputSuggest("label")}
          />
          {selected ? (
            <label className="blk-inline-field">
              Opens
              <input
                aria-label="Button link"
                value={block.href ?? ""}
                placeholder="https:// or {{"
                onChange={(event) => onChange({ href: event.target.value })}
                {...inputSuggest("href")}
              />
            </label>
          ) : null}
        </div>
      ) : null}
      {block.type === "divider" ? (
        <div style={{ textAlign: look.align, margin: "22px 0" }}>
          <div
            style={{
              display: "inline-block",
              width: `${look.width}%`,
              height: look.thickness,
              background: look.accent,
            }}
          />
        </div>
      ) : null}
      {block.type === "social" ? (
        <div className="blk-social" style={{ textAlign: look.align }}>
          {socialNetworks.map((network) => (
            <span
              key={network.key}
              className="blk-social-badge"
              style={{ background: look.accent }}
              title={`${network.label} link from Settings`}
            >
              <SocialLogo network={network.key} />
            </span>
          ))}
          {selected ? (
            <small className="blk-social-note">
              Links come from Settings → Social media.
            </small>
          ) : null}
        </div>
      ) : null}
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
      {suggest && options.length ? (
        <ul className="ph-menu" role="listbox" aria-label="Merge fields">
          {options.map((field, position) => (
            <li key={field.key}>
              <button
                type="button"
                role="option"
                aria-selected={position === suggest.index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  suggest.apply(field.key);
                  close();
                }}
              >
                <code>{`{{${field.key}}}`}</code>
                <span>{field.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BlockList({
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
          Add blocks from the list to start.
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

export function insertAfter(
  blocks: EmailBlock[],
  selected: string | undefined,
  block: EmailBlock,
) {
  const index = blocks.findIndex((entry) => entry.id === selected);
  const next = [...blocks];
  next.splice(index < 0 ? next.length : index + 1, 0, block);
  return next;
}
export function Palette({
  onAdd,
  types,
  compact = false,
}: {
  onAdd: (block: EmailBlock) => void;
  types?: BlockType[];
  /** One row of small buttons, for editors with less room. */
  compact?: boolean;
}) {
  return (
    <div
      className={`palette${compact ? " compact" : ""}`}
      role="group"
      aria-label="Add a block"
    >
      {blockCatalog
        .filter((entry) => !types || types.includes(entry.type))
        .map((entry) => (
          <button
            key={entry.type}
            type="button"
            className="palette-item"
            title={entry.hint}
            onClick={() => onAdd(entry.create())}
          >
            <Icon name={blockIcons[entry.type]} size={compact ? 15 : 18} />
            <span>
              <b>{entry.label}</b>
              {compact ? null : <small>{entry.hint}</small>}
            </span>
          </button>
        ))}
    </div>
  );
}

export function useMutation() {
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
export function Modal({
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

