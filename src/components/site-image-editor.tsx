"use client";
import { useEffect, useRef, useState } from "react";
import { adminMutation } from "@/lib/actions";
import { ActionForm, type ActionResult } from "./action-form";
import { SiteSelect } from "./site-select";
import type { siteImage } from "@/lib/site-images";
type EditorImage = ReturnType<typeof siteImage>;
const groups = [
  "Homepage",
  "Meet Sibel",
  "Community & membership",
  "Solutions",
  "Blog cover styles",
  "Blog posts",
  "Podcast",
  "Contact",
  "Sign in",
  "Join",
  "Member panel",
  "Header & footer",
];

function ImageEditor({ image }: { image: EditorImage }) {
  const input = useRef<HTMLInputElement>(null),
    temporaryUrl = useRef("");
  const [preview, setPreview] = useState(""),
    [fileName, setFileName] = useState(""),
    [error, setError] = useState("");
  const [focus, setFocus] = useState<string>();
  useEffect(
    () => () => {
      if (temporaryUrl.current) URL.revokeObjectURL(temporaryUrl.current);
    },
    [],
  );
  const clear = () => {
    if (temporaryUrl.current) URL.revokeObjectURL(temporaryUrl.current);
    temporaryUrl.current = "";
    setPreview("");
    setFileName("");
    setError("");
    setFocus(undefined);
    if (input.current) input.current.value = "";
  };
  const save = async (previous: ActionResult, data: FormData) => {
    const result = await adminMutation(previous, data);
    if (result.ok) clear();
    return result;
  };
  const positions = new Map([
    [image.position, "Current framing"],
    ["center", "Center"],
    ["center top", "Top"],
    ["center 25%", "Upper center"],
    ["center 75%", "Lower center"],
    ["center bottom", "Bottom"],
  ]);
  return (
    <article className="page-image-card">
      <div className={`page-image-preview ${image.logo ? "logo-preview" : ""}`}>
        {/* Uploaded previews also use browser object URLs, so optimization is handled after upload. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          loading="lazy"
          src={preview || image.src}
          alt={image.alt || image.label}
          style={{ objectPosition: focus ?? image.position }}
        />
        <span className="badge b-grey">
          {image.custom ? "Custom image" : "Default image"}
        </span>
      </div>
      <h4>{image.label}</h4>
      <ActionForm action={save} submitLabel="Save image">
        <input type="hidden" name="entity" value="siteImages" />
        <input type="hidden" name="slot" value={image.id} />
        <label className="field">
          Upload replacement
          <input
            ref={input}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                clear();
                return;
              }
              if (
                file.size > 3 * 1024 * 1024 ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              ) {
                clear();
                setError("Choose a JPG, PNG or WebP image up to 3 MB.");
                return;
              }
              if (temporaryUrl.current)
                URL.revokeObjectURL(temporaryUrl.current);
              temporaryUrl.current = URL.createObjectURL(file);
              setPreview(temporaryUrl.current);
              setFileName(file.name);
              setError("");
            }}
          />
        </label>
        <p className="image-file-name">
          {fileName || image.fileName || "Original site image"}
        </p>
        {error && (
          <p role="alert" className="form-feedback error">
            {error}
          </p>
        )}
        <label className="field">
          Image description
          <input
            key={image.alt}
            name="alt"
            defaultValue={image.alt}
            maxLength={300}
            placeholder="Describe the image, or leave blank if decorative"
          />
        </label>
        {!image.logo ? (
          <SiteSelect
            name="position"
            label="Image focus"
            value={focus ?? image.position}
            onValueChange={setFocus}
            options={[...positions].map(([value, label]) => ({ value, label }))}
          />
        ) : (
          <input name="position" type="hidden" value="center" />
        )}
        <div className="image-card-actions">
          {preview && (
            <button
              className="btn btn-sm btn-ghost"
              type="button"
              onClick={clear}
            >
              Cancel replacement
            </button>
          )}
          <button className="btn btn-sm btn-ghost" name="op" value="restore">
            Restore default
          </button>
        </div>
      </ActionForm>
    </article>
  );
}
export function SiteImageEditor({ images }: { images: EditorImage[] }) {
  const [group, setGroup] = useState("Homepage");
  const selected = images.filter((image) => image.group === group);
  return (
    <section className="panel site-images-editor">
      <h3>Page images</h3>
      <p className="muted">
        Choose a page, then replace its images. JPG, PNG and WebP up to 3 MB.
        Each image is saved separately.
      </p>
      <SiteSelect
        label="Page or image section"
        value={group}
        onValueChange={setGroup}
        options={groups.map((value) => ({ value, label: value }))}
      />
      {group === "Blog posts" && (
        <p className="hint">
          A post replacement appears on its article page and wherever its cover
          is shown. Restoring it uses the post’s selected cover style.
        </p>
      )}
      {group === "Header & footer" && (
        <p className="hint">
          The brand icon is shared across all pages. A transparent PNG works
          well.
        </p>
      )}
      {selected.length ? (
        <div className="page-images-grid">
          {selected.map((image) => (
            <ImageEditor key={image.id} image={image} />
          ))}
        </div>
      ) : (
        <div className="page-images-empty">
          <h4>No page-specific images here</h4>
          <p>
            This page uses the shared brand icon, available under Header &amp;
            footer. Announcement images are edited in Announcements.
          </p>
        </div>
      )}
    </section>
  );
}
