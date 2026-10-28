import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import DOMPurify from "dompurify";
import { adminMutation } from "@/lib/actions";
import {
  blockCatalog,
  formatHtml,
  withNewIds,
  type BlockType,
  type EmailBlock,
} from "@/lib/email-blocks";
import type { MediaItem } from "@/lib/site-images";
import { Icon, type IconName } from "./admin-icons";
import { MediaPicker } from "./media-library";
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
export function format(command: string, value?: string) {
  document.execCommand(command, false, value);
  document.activeElement?.dispatchEvent(new Event("input", { bubbles: true }));
}
export const richTypes: BlockType[] = ["text", "quote", "note"];

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

