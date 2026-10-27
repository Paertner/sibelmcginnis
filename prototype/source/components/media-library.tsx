import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { adminMutation } from "@/lib/actions";
import { Icon } from "./admin-icons";
import { SiteSelect } from "./site-select";
import type { MediaItem, SiteImage } from "@/lib/site-images";

const focusOptions = [
  ["center", "Center"],
  ["center top", "Top"],
  ["center 25%", "Upper center"],
  ["center 75%", "Lower center"],
  ["center bottom", "Bottom"],
];
const sizeLabel = (bytes?: number) =>
  bytes === undefined
    ? "Included with the site"
    : bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const typeLabel = (type: string) =>
  type.replace("image/", "").replace("svg+xml", "SVG").toUpperCase();

type Feedback = { message: string; ok?: boolean } | null;
function useMutation() {
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const run = (fields: Record<string, string | File | File[]>) =>
    new Promise<{ ok?: boolean; id?: string }>((resolve) =>
      start(async () => {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields))
          for (const item of Array.isArray(value) ? value : [value])
            form.append(key, item);
        const result = await adminMutation({ message: "" }, form);
        setFeedback(result);
        resolve(result);
      }),
    );
  return { pending, feedback, setFeedback, run };
}
function FeedbackLine({ feedback }: { feedback: Feedback }) {
  return feedback?.message ? (
    <p
      className={`form-feedback ${feedback.ok ? "success" : "error"}`}
      role="status"
    >
      {feedback.message}
    </p>
  ) : null;
}

function MediaGrid({
  items,
  selected,
  onSelect,
  label,
}: {
  items: MediaItem[];
  selected?: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <ul className="media-grid" aria-label={label}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="media-tile"
            aria-pressed={selected === item.id}
            onClick={() => onSelect(item.id)}
            title={item.fileName}
          >
            {/* Library thumbnails include browser-local uploads, so they stay plain images. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt="" loading="lazy" />
            {selected === item.id ? (
              <span className="media-tile-check">
                <Icon name="check" size={14} />
              </span>
            ) : null}
            <span className="visually-hidden">{item.fileName}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function UploadZone({
  onFiles,
  pending,
}: {
  onFiles: (files: File[]) => void;
  pending: boolean;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={`upload-zone${over ? " over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        onFiles([...event.dataTransfer.files]);
      }}
    >
      <Icon name="upload" size={28} />
      <b>{pending ? "Uploading…" : "Drop images here"}</b>
      <span>or</span>
      <span className="btn btn-sm">Select files</span>
      <small>JPG, PNG or WebP, up to 3 MB each</small>
      <input
        type="file"
        className="visually-hidden"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={pending}
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function Details({
  item,
  children,
}: {
  item: MediaItem;
  children?: React.ReactNode;
}) {
  const [size, setSize] = useState("");
  return (
    <div className="media-details">
      <h4>Image details</h4>
      <div className="media-details-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt=""
          onLoad={(event) =>
            setSize(
              `${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight} px`,
            )
          }
        />
      </div>
      <p className="media-file-name">{item.fileName}</p>
      <dl className="media-meta">
        <dt>Type</dt>
        <dd>{typeLabel(item.type)}</dd>
        <dt>Size</dt>
        <dd>{sizeLabel(item.size)}</dd>
        {size ? (
          <>
            <dt>Dimensions</dt>
            <dd>{size}</dd>
          </>
        ) : null}
        <dt>Added</dt>
        <dd>
          {item.uploadedAt
            ? new Date(item.uploadedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Original site photo"}
        </dd>
      </dl>
      {children}
    </div>
  );
}

function Picker({
  slot,
  media,
  onClose,
  onSaved,
}: {
  slot: SiteImage;
  media: MediaItem[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [selected, setSelected] = useState(slot.mediaId);
  const [alt, setAlt] = useState(slot.alt);
  const [focus, setFocus] = useState(slot.position);
  const { pending, feedback, setFeedback, run } = useMutation();
  // Unmounting removes the dialog; closing it in a cleanup would fire onClose and
  // dismiss the picker under Strict Mode's double effects.
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const item = media.find((entry) => entry.id === selected);
  const upload = async (files: File[]) => {
    if (!files.length) return;
    const result = await run({ entity: "media", op: "upload", image: files });
    if (result.ok && result.id) {
      setSelected(result.id);
      setTab("library");
    }
  };
  const save = async () => {
    const result = await run({
      entity: "siteImages",
      slot: slot.id,
      media: selected,
      alt,
      position: slot.logo ? "center" : focus,
    });
    if (result.ok) {
      onSaved(`${slot.label}: image updated.`);
      onClose();
    }
  };
  return (
    <dialog
      ref={dialog}
      className="media-picker"
      aria-labelledby="media-picker-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="media-picker-head">
        <div>
          <h3 id="media-picker-title">Choose an image</h3>
          <p>
            {slot.group} · {slot.label}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <div className="media-picker-tabs" role="tablist">
        {(
          [
            ["library", "Media library"],
            ["upload", "Upload files"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setFeedback(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="media-picker-body">
        <div className="media-picker-main">
          {tab === "upload" ? (
            <UploadZone onFiles={upload} pending={pending} />
          ) : (
            <MediaGrid
              items={media}
              selected={selected}
              onSelect={setSelected}
              label="Media library"
            />
          )}
        </div>
        {item ? (
          <aside className="media-picker-side" key={item.id}>
            <Details item={item} />
            <label className="field">
              Image description
              <textarea
                value={alt}
                maxLength={300}
                onChange={(event) => setAlt(event.target.value)}
                placeholder="Describe the image for screen readers, or leave blank if decorative"
              />
            </label>
            {!slot.logo ? (
              <SiteSelect
                label="Image focus"
                value={focus}
                onValueChange={setFocus}
                options={[
                  ...(focusOptions.some(([value]) => value === slot.position)
                    ? []
                    : [[slot.position, "Current framing"]]),
                  ...focusOptions,
                ].map(([value, label]) => ({ value, label }))}
              />
            ) : null}
            {!slot.logo ? (
              <div className="focus-preview" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt="" style={{ objectPosition: focus }} />
                <small>How it is framed on the page</small>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
      <footer className="media-picker-foot">
        <FeedbackLine feedback={feedback} />
        <span className="media-picker-selection">
          {item ? item.fileName : "Select an image"}
        </span>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn"
          disabled={!item || pending}
          onClick={save}
        >
          {pending ? "Saving…" : "Use this image"}
        </button>
      </footer>
    </dialog>
  );
}

export function MediaLibrary({
  media,
  slots,
}: {
  media: MediaItem[];
  slots: SiteImage[];
}) {
  const groups = useMemo(
    // Page groups in site order, with the shared header and footer icon last.
    () =>
      [...new Set(slots.map((slot) => slot.group))].sort(
        (a, b) =>
          Number(a === "Header & footer") - Number(b === "Header & footer"),
      ),
    [slots],
  );
  const [view, setView] = useState<"pages" | "library">("pages");
  const [group, setGroup] = useState(groups[0]);
  const [picking, setPicking] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
  const [query, setQuery] = useState("");
  const { pending, feedback, setFeedback, run } = useMutation();
  const pickingSlot = slots.find((slot) => slot.id === picking);
  const visible = media.filter(
    (item) =>
      (filter === "all" ||
        (filter === "used" ? item.usedBy.length > 0 : !item.usedBy.length)) &&
      item.fileName.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const active = media.find((item) => item.id === selected);
  return (
    <div className="media-library">
      <div className="segmented" role="tablist" aria-label="Media views">
        <button
          type="button"
          role="tab"
          aria-selected={view === "pages"}
          onClick={() => setView("pages")}
        >
          Page images
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "library"}
          onClick={() => setView("library")}
        >
          Library <span className="count">{media.length}</span>
        </button>
      </div>
      <FeedbackLine feedback={feedback} />

      {view === "pages" ? (
        <section aria-label="Images on each page">
          <div className="chip-row" role="group" aria-label="Page">
            {groups.map((name) => (
              <button
                key={name}
                type="button"
                className="filter-chip"
                aria-pressed={group === name}
                onClick={() => setGroup(name)}
              >
                {name}
                <span className="count">
                  {slots.filter((slot) => slot.group === name).length}
                </span>
              </button>
            ))}
          </div>
          <div className="placement-grid">
            {slots
              .filter((slot) => slot.group === group)
              .map((slot) => (
                <article className="placement" key={slot.id}>
                  <button
                    type="button"
                    className={`placement-thumb${slot.logo ? " logo" : ""}`}
                    onClick={() => setPicking(slot.id)}
                    aria-label={`Change image: ${slot.label}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slot.src}
                      alt=""
                      loading="lazy"
                      style={{ objectPosition: slot.position }}
                    />
                    <span className="placement-hover">
                      <Icon name="image" size={18} /> Change image
                    </span>
                  </button>
                  <div className="placement-body">
                    <h4>{slot.label}</h4>
                    <span
                      className={`badge ${slot.custom ? "b-premium" : "b-grey"}`}
                    >
                      {slot.custom ? "Replaced" : "Original"}
                    </span>
                  </div>
                  <div className="placement-actions">
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setPicking(slot.id)}
                    >
                      Change image
                    </button>
                    {slot.custom ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        disabled={pending}
                        onClick={() =>
                          run({
                            entity: "siteImages",
                            slot: slot.id,
                            op: "restore",
                          })
                        }
                      >
                        Restore original
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
          </div>
        </section>
      ) : (
        <section className="library-layout" aria-label="Media library">
          <div className="library-main">
            <div className="library-toolbar">
              <div className="chip-row" role="group" aria-label="Show">
                {(
                  [
                    ["all", "All images"],
                    ["used", "In use"],
                    ["unused", "Not used"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="filter-chip"
                    aria-pressed={filter === key}
                    onClick={() => setFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="search-field">
                <Icon name="search" size={16} />
                <span className="visually-hidden">Search by file name</span>
                <input
                  type="search"
                  value={query}
                  placeholder="Search by file name"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="btn btn-sm upload-btn">
                <Icon name="upload" size={16} />
                {pending ? "Uploading…" : "Upload images"}
                <input
                  type="file"
                  className="visually-hidden"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={pending}
                  onChange={async (event) => {
                    const files = [...(event.target.files ?? [])];
                    event.target.value = "";
                    if (!files.length) return;
                    const result = await run({
                      entity: "media",
                      op: "upload",
                      image: files,
                    });
                    if (result.ok && result.id) setSelected(result.id);
                  }}
                />
              </label>
            </div>
            {visible.length ? (
              <MediaGrid
                items={visible}
                selected={selected}
                onSelect={setSelected}
                label="Images"
              />
            ) : (
              <p className="empty-note">
                {media.length
                  ? "No images match. Clear the search or choose All images."
                  : "No images yet. Upload images to start your library."}
              </p>
            )}
          </div>
          <aside className="library-side">
            {active ? (
              <Details item={active} key={active.id}>
                <div className="media-used">
                  <b>Used on</b>
                  {active.usedBy.length ? (
                    <ul>
                      {active.usedBy.map((place) => (
                        <li key={place}>{place}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Not used on any page yet.</p>
                  )}
                </div>
                {!active.builtin ? (
                  <button
                    type="button"
                    className="link-danger"
                    disabled={pending}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          active.usedBy.length
                            ? "Delete this image? The pages using it will go back to their original image."
                            : "Delete this image permanently?",
                        )
                      )
                        return;
                      const result = await run({
                        entity: "media",
                        op: "remove",
                        media: active.id,
                      });
                      if (result.ok) setSelected(undefined);
                    }}
                  >
                    <Icon name="trash" size={16} /> Delete permanently
                  </button>
                ) : (
                  <p className="hint-small">
                    Original site photos can’t be deleted.
                  </p>
                )}
              </Details>
            ) : (
              <div className="library-side-empty">
                <Icon name="image" size={28} />
                <p>Select an image to see its details and where it is used.</p>
              </div>
            )}
          </aside>
        </section>
      )}
      {pickingSlot ? (
        <Picker
          key={pickingSlot.id}
          slot={pickingSlot}
          media={media}
          onClose={() => setPicking(undefined)}
          onSaved={(message) => setFeedback({ message, ok: true })}
        />
      ) : null}
    </div>
  );
}
