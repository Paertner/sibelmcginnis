"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import catalog from "@/lib/site-copy-catalog.json";
import { adminMutation } from "@/lib/actions";
import { editorPages, seoId, sharedGroups } from "@/lib/editor-pages";
import { withWeekday } from "@/lib/weekday";
import type { MediaItem, SiteImage } from "@/lib/site-images";
import { askConfirm } from "./confirm-dialog";
import { MediaPicker } from "./media-library";
import { useToast } from "./toast";

type Entry = (typeof catalog)[number];
/** One edited element of the previewed page. */
type Edit = { ids: string[]; text: string; reset: boolean };
const normalize = (value: string) => value.replace(/[\s ]+/g, " ").trim();
const SKIP = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "BUTTON",
  "TITLE",
]);
const FRAME_STYLE = `
[data-ve]{cursor:text;outline:2px dashed transparent;outline-offset:3px;border-radius:4px;transition:outline-color .15s}
[data-ve]:hover{outline-color:rgba(155,94,65,.55)}
[data-ve]:focus{outline:2px solid #9b5e41;background:rgba(155,94,65,.08)}
[data-ve-dirty]{outline-color:rgba(47,122,67,.7)!important}
[data-site-image]{cursor:pointer}
[data-site-image]:hover{outline:3px solid #9b5e41;outline-offset:-3px}
html{scroll-behavior:auto!important}
`;

export type SeoValues = Record<string, { title: string; description: string }>;

export function VisualEditor({
  values,
  weekday,
  images,
  media,
  seo,
  defaultSeo,
}: {
  values: Record<string, string>;
  weekday: number;
  images: Record<string, SiteImage>;
  media: MediaItem[];
  seo: SeoValues;
  /** What the search engines get when nothing was saved, per page key. */
  defaultSeo: SeoValues;
}) {
  const toast = useToast();
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [pageKey, setPageKey] = useState(editorPages[0].key);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState<string>();
  // Saved copy as the preview shows it. It follows saves immediately, before the page props refresh.
  const savedValues = useRef(values);
  const [savedSeo, setSavedSeo] = useState(seo);
  const [seoDraft, setSeoDraft] = useState(() => seoStart(seo, defaultSeo));
  const edits = useRef(new Map<HTMLElement, Edit>());
  const active = useRef<HTMLElement | null>(null);
  const imagesRef = useRef(images);
  const meta = useRef(new Map<HTMLElement, { ids: string[]; shown: string }>());
  const [editCount, setEditCount] = useState(0);
  const [selected, setSelected] = useState<{
    element: HTMLElement;
    resettable: boolean;
    top: number;
    left: number;
  } | null>(null);
  const page = editorPages.find((entry) => entry.key === pageKey)!;
  const frameKey = `${pageKey}-${reload}`;

  const defaults = defaultSeo[pageKey];
  const seoNow = seoDraft[pageKey] ?? defaults;
  const seoSaved = savedSeo[pageKey] ?? defaults;
  const seoChanged =
    seoNow.title !== seoSaved.title ||
    seoNow.description !== seoSaved.description;
  const changes = editCount + (seoChanged ? 1 : 0);

  // What each text is called in the catalog, as it currently reads on the site.
  const lookup = useCallback(() => {
    const preferred = new Set([...page.groups, ...sharedGroups]);
    const map = new Map<string, Entry[]>();
    for (const entry of catalog) {
      const shown = normalize(
        savedValues.current[entry.id] ?? withWeekday(entry.text, weekday),
      );
      if (!shown) continue;
      map.set(shown, [...(map.get(shown) ?? []), entry]);
    }
    // Several ids can share one wording; prefer the ones that belong to this page.
    for (const [shown, list] of map) {
      const here = list.filter((entry) => preferred.has(entry.group));
      map.set(shown, here.length ? here : list);
    }
    return map;
  }, [page.groups, weekday]);

  // A text can go back to the wording the site shipped with when it was edited here or saved earlier.
  const canReset = (element: HTMLElement | undefined) => {
    if (!element) return false;
    const edit = edits.current.get(element);
    if (edit) return !edit.reset;
    const ids = meta.current.get(element)?.ids ?? [];
    return ids.some((id) => savedValues.current[id] !== undefined);
  };
  const positionToolbar = useCallback((element: HTMLElement | null) => {
    const holder = stage.current;
    const iframe = frame.current;
    active.current = element;
    if (!element || !holder || !iframe) return setSelected(null);
    const box = element.getBoundingClientRect();
    const outer = iframe.getBoundingClientRect();
    const base = holder.getBoundingClientRect();
    setSelected({
      element,
      resettable: canReset(element),
      // Above the text with a clear gap; below it when the text is at the top of the preview.
      top:
        box.top < 64
          ? outer.top - base.top + box.bottom + 12
          : outer.top - base.top + box.top - 62,
      left: Math.min(
        Math.max(4, outer.left - base.left + box.left),
        Math.max(4, base.width - 230),
      ),
    });
  }, []);

  const prepare = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    edits.current.clear();
    setEditCount(0);
    setSelected(null);
    const style = doc.createElement("style");
    style.textContent = FRAME_STYLE;
    doc.head.append(style);
    const known = lookup();
    const originals = new Map<HTMLElement, { ids: string[]; shown: string }>();
    meta.current = originals;
    for (const element of doc.body.querySelectorAll<HTMLElement>("*")) {
      if (SKIP.has(element.tagName.toUpperCase())) continue;
      if (element.closest("svg,script,style,noscript,button,select")) continue;
      const nodes = [...element.childNodes];
      if (!nodes.length || !nodes.every((node) => node.nodeType === 3))
        continue;
      const shown = normalize(element.textContent ?? "");
      const match = known.get(shown);
      if (!shown || !match) continue;
      element.setAttribute("data-ve", "");
      try {
        element.contentEditable = "plaintext-only";
      } catch {
        element.contentEditable = "true";
      }
      if (element.contentEditable !== "plaintext-only")
        element.contentEditable = "true";
      originals.set(element, { ids: match.map((entry) => entry.id), shown });
    }
    const itemFor = (target: EventTarget | null) =>
      (target as HTMLElement | null)?.closest?.(
        "[data-ve]",
      ) as HTMLElement | null;
    doc.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement;
        const image = target.closest?.("[data-site-image]");
        if (image) {
          event.preventDefault();
          const id = image.getAttribute("data-site-image") ?? "";
          if (imagesRef.current[id]) setPicking(id);
          else
            toast(
              id.startsWith("post.") || id.startsWith("event.")
                ? "This picture is changed in the post or event editor."
                : "This picture cannot be changed here.",
              false,
            );
          return;
        }
        if (
          target.closest?.("a,button,label") ||
          (target.closest?.("summary") && itemFor(target))
        )
          event.preventDefault();
      },
      true,
    );
    doc.addEventListener("submit", (event) => event.preventDefault(), true);
    doc.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && itemFor(event.target))
        event.preventDefault();
      if (event.key === " " && itemFor(event.target)) event.stopPropagation();
    });
    doc.addEventListener("paste", (event) => {
      if (!itemFor(event.target)) return;
      event.preventDefault();
      const text = normalize(event.clipboardData?.getData("text/plain") ?? "");
      if (text) doc.execCommand("insertText", false, text);
    });
    doc.addEventListener("focusin", (event) => {
      const element = itemFor(event.target);
      if (element) positionToolbar(element);
    });
    doc.addEventListener("focusout", (event) => {
      const element = itemFor(event.target);
      if (!element) return;
      // An emptied text goes back to what it was.
      if (!normalize(element.textContent ?? "")) {
        const edit = edits.current.get(element);
        element.textContent = edit
          ? withWeekday(
              catalog.find((entry) => entry.id === edit.ids[0])!.text,
              weekday,
            )
          : (originals.get(element)?.shown ?? "");
        edits.current.delete(element);
        element.removeAttribute("data-ve-dirty");
        setEditCount(edits.current.size);
      }
    });
    doc.addEventListener("input", (event) => {
      const element = itemFor(event.target);
      const original = element && originals.get(element);
      if (!element || !original) return;
      const text = normalize(element.textContent ?? "");
      if (text === original.shown) {
        edits.current.delete(element);
        element.removeAttribute("data-ve-dirty");
      } else if (text) {
        edits.current.set(element, {
          ids: original.ids,
          text,
          reset: false,
        });
        element.setAttribute("data-ve-dirty", "");
      }
      setEditCount(edits.current.size);
      positionToolbar(element);
    });
    doc.defaultView?.addEventListener("scroll", () =>
      setSelected((current) => {
        if (current) positionToolbar(current.element);
        return current;
      }),
    );
  }, [lookup, positionToolbar, toast, weekday]);

  const switchPage = async (key: string) => {
    if (key === pageKey) return;
    if (
      changes &&
      !(await askConfirm("Your unsaved changes on this page will be lost.", {
        title: "Switch page?",
        confirmLabel: "Yes, discard changes",
      }))
    )
      return;
    setPageKey(key);
    setSelected(null);
  };

  const discard = () => {
    edits.current.clear();
    setEditCount(0);
    setSeoDraft((current) => ({ ...current, [pageKey]: seoSaved }));
    setReload((n) => n + 1);
  };

  const useOriginal = () => {
    const element = active.current;
    const ids =
      (element &&
        (edits.current.get(element)?.ids ?? meta.current.get(element)?.ids)) ||
      [];
    if (!element || !ids.length) return;
    const first = catalog.find((entry) => entry.id === ids[0])!;
    element.textContent = withWeekday(first.text, weekday);
    element.setAttribute("data-ve-dirty", "");
    // Saving a text that equals its original removes the override.
    edits.current.set(element, { ids, text: first.text, reset: true });
    setEditCount(edits.current.size);
    positionToolbar(element);
  };

  const save = async () => {
    setSaving(true);
    const form = new FormData();
    form.set("entity", "siteCopy");
    const applied: Record<string, string | null> = {};
    for (const edit of edits.current.values())
      for (const id of edit.ids) {
        const original = catalog.find((entry) => entry.id === id)!.text;
        form.set(`copy:${id}`, edit.reset ? original : edit.text);
        applied[id] = edit.reset ? null : edit.text;
      }
    const nextSeo = { ...seoNow };
    if (seoChanged) {
      for (const field of ["title", "description"] as const)
        if (seoNow[field] !== seoSaved[field])
          form.set(
            `copy:${seoId(pageKey, field)}`,
            seoNow[field] === defaults[field] ? "" : seoNow[field],
          );
    }
    const result = await adminMutation({ message: "" }, form);
    setSaving(false);
    toast(result.message, !!result.ok);
    if (!result.ok) return;
    const merged = { ...savedValues.current };
    for (const [id, value] of Object.entries(applied))
      if (value === null) delete merged[id];
      else merged[id] = value;
    savedValues.current = merged;
    setSavedSeo((current) => ({ ...current, [pageKey]: nextSeo }));
    edits.current.clear();
    setEditCount(0);
    setReload((n) => n + 1);
    router.refresh();
  };

  // Leaving with unsaved changes asks the browser to confirm.
  useEffect(() => {
    if (!changes) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changes]);

  const slot = picking ? images[picking] : undefined;

  return (
    <section className="panel visual-editor">
      <div className="ve-bar">
        <label className="ve-page">
          <span>Page</span>
          <select
            value={pageKey}
            onChange={(event) => switchPage(event.target.value)}
          >
            {editorPages.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <div className="ve-device" role="group" aria-label="Preview width">
          {(["desktop", "mobile"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              aria-pressed={device === kind}
              onClick={() => {
                setDevice(kind);
                setSelected(null);
              }}
            >
              {kind === "desktop" ? "Desktop" : "Mobile"}
            </button>
          ))}
        </div>
        <span className="ve-count" aria-live="polite">
          {changes
            ? `${changes} unsaved change${changes === 1 ? "" : "s"}`
            : "No unsaved changes"}
        </span>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          disabled={!changes || saving}
          onClick={discard}
        >
          Discard
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!changes || saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save and publish"}
        </button>
      </div>
      <p className="hint">
        Click any text in the preview to type over it. Click a picture to
        replace it. Menus, buttons and labels that the preview cannot reach are
        in “Text list (advanced)”.
      </p>
      <div className="ve-seo">
        <label className="field">
          Search title
          <input
            value={seoNow.title}
            maxLength={200}
            onChange={(event) =>
              setSeoDraft((current) => ({
                ...current,
                [pageKey]: { ...seoNow, title: event.target.value },
              }))
            }
            placeholder={defaults.title}
          />
        </label>
        <label className="field">
          Search description
          <textarea
            rows={2}
            value={seoNow.description}
            maxLength={400}
            onChange={(event) =>
              setSeoDraft((current) => ({
                ...current,
                [pageKey]: { ...seoNow, description: event.target.value },
              }))
            }
            placeholder={defaults.description}
          />
        </label>
      </div>
      <div className="ve-stage" ref={stage}>
        <iframe
          key={frameKey}
          ref={frame}
          className={`ve-frame ${device}`}
          title={`Preview of ${page.label}`}
          src={`/api/preview?path=${encodeURIComponent(page.path)}&v=${reload}`}
          sandbox="allow-same-origin allow-scripts"
          onLoad={prepare}
        />
        {selected ? (
          <div
            className="ve-toolbar"
            style={{ top: selected.top, left: selected.left }}
          >
            <span>Editing text</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={!selected.resettable}
              onMouseDown={(event) => event.preventDefault()}
              onClick={useOriginal}
            >
              Use original text
            </button>
          </div>
        ) : null}
      </div>
      {slot ? (
        <MediaPicker
          slot={slot}
          media={media}
          onClose={() => setPicking(undefined)}
          onSaved={(message) => {
            toast(message);
            setReload((n) => n + 1);
          }}
        />
      ) : null}
    </section>
  );
}

function seoStart(saved: SeoValues, defaults: SeoValues): SeoValues {
  return Object.fromEntries(
    Object.keys(defaults).map((key) => [key, saved[key] ?? defaults[key]]),
  );
}
