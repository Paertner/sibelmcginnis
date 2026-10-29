import "server-only";
import { randomUUID } from "node:crypto";
import { getDemoState, getStore, type MediaFile, type Post } from "./store";
import { siteText } from "./site-copy";
import { siteImageCatalog, type ImageSlot } from "./site-image-catalog";

export function siteImageSlots(): ImageSlot[] {
  return [
    ...siteImageCatalog,
    ...getStore().posts.map((post) => ({
      id: `post.${post.id}`,
      group: "Blog posts",
      label: post.title,
      src: siteImageCatalog.find(
        (slot) => slot.id === `blog.cover-${post.cover % 3}`,
      )!.src,
      alt: post.title,
      position: "center",
      postId: post.id,
    })),
    ...(getStore().events ?? []).map((event, index) => ({
      id: `event.${event.id}`,
      group: "Events",
      label: event.title,
      src: siteImageCatalog.find(
        (slot) => slot.id === `blog.cover-${index % 3}`,
      )!.src,
      alt: event.title,
      position: "center",
    })),
  ];
}
export type SiteImage = ImageSlot & {
  src: string;
  alt: string;
  position: string;
  custom: boolean;
  fileName: string;
  mediaId: string;
};
const builtinId = (src: string) => `builtin:${src}`;
export function siteImage(id: string): SiteImage {
  const slot = siteImageSlots().find((entry) => entry.id === id);
  if (!slot) throw new Error("Unknown page image.");
  const saved = getStore().siteImages?.[id];
  const post = slot.postId
    ? getStore().posts.find((post) => post.id === slot.postId)
    : undefined;
  const base = post ? siteImage(`blog.cover-${post.cover % 3}`) : undefined;
  const builtin = saved?.builtin ?? (saved?.imageId ? undefined : slot.src);
  return {
    ...slot,
    src: saved?.imageId
      ? `/api/site-image/${saved.imageId}`
      : saved?.builtin
        ? saved.builtin
        : (base?.src ?? slot.src),
    alt: saved?.alt ?? (slot.altCopyId ? siteText(slot.altCopyId) : slot.alt),
    position: saved?.position ?? base?.position ?? slot.position,
    custom: !!saved?.imageId || !!saved?.builtin || !!base?.custom,
    fileName: saved?.fileName ?? base?.fileName ?? "",
    mediaId: saved?.imageId
      ? saved.imageId
      : saved?.builtin || !base
        ? builtinId(builtin!)
        : base.mediaId,
  };
}
export function siteImageProps(id: string) {
  const image = siteImage(id);
  return {
    src: image.src,
    alt: image.alt,
    unoptimized: image.custom,
    style: {
      objectPosition: image.position,
      ...(image.logo ? { objectFit: "contain" as const } : {}),
    },
  };
}
export function siteBackground(id: string) {
  const image = siteImage(id);
  return {
    style: {
      backgroundImage: `url("${image.src}")`,
      backgroundPosition: image.position,
    },
    role: "img",
    "aria-label": image.alt || undefined,
    "aria-hidden": !image.alt ? (true as const) : undefined,
  };
}
export function postImageProps(post: Post) {
  return siteImageProps(
    getStore().siteImages?.[`post.${post.id}`]
      ? `post.${post.id}`
      : `blog.cover-${post.cover % 3}`,
  );
}

export type MediaItem = {
  id: string;
  src: string;
  /** Stable address saved in content; src may be a browser-local URL. */
  path: string;
  fileName: string;
  type: string;
  size?: number;
  uploadedAt?: string;
  builtin: boolean;
  usedBy: string[];
};
// Uploaded files plus the site's original photos, newest uploads first, each with the placements using it.
export function mediaLibrary(): MediaItem[] {
  const data = getStore(),
    state = getDemoState();
  const uploaded: MediaFile[] = [...(data.media ?? [])];
  // Images saved before the library existed are listed so they can be reused or deleted.
  for (const saved of Object.values(data.siteImages ?? {}))
    if (
      saved.imageId &&
      state.images.has(saved.imageId) &&
      !uploaded.some((file) => file.id === saved.imageId)
    )
      uploaded.push({
        id: saved.imageId,
        fileName: saved.fileName || "Uploaded image",
        type: state.images.get(saved.imageId)!.type,
        size: state.images.get(saved.imageId)!.bytes.length,
        uploadedAt: "",
      });
  const slots = siteImageSlots().map((slot) => siteImage(slot.id));
  const usedBy = (id: string) =>
    slots
      .filter((slot) => slot.mediaId === id)
      .map((slot) => `${slot.group} · ${slot.label}`);
  const builtins = [...new Set(siteImageCatalog.map((slot) => slot.src))];
  return [
    ...uploaded
      .filter((file) => state.images.has(file.id))
      .toSorted((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .map((file) => ({
        ...file,
        src: `/api/site-image/${file.id}`,
        path: `/api/site-image/${file.id}`,
        builtin: false,
        usedBy: usedBy(file.id),
      })),
    ...builtins.map((src) => ({
      id: builtinId(src),
      src,
      path: src,
      fileName: src.split("/").at(-1)!,
      type: src.endsWith(".svg") ? "image/svg+xml" : "image/webp",
      builtin: true,
      usedBy: usedBy(builtinId(src)),
    })),
  ];
}

const imageTypes = ["image/png", "image/jpeg", "image/webp"];
async function readImage(file: File) {
  if (file.size > 3 * 1024 * 1024 || !imageTypes.includes(file.type))
    throw new Error(
      `${file.name}: choose a JPG, PNG or WebP image up to 3 MB.`,
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = Buffer.from(bytes.subarray(0, 12));
  if (
    !(
      file.type === "image/png" &&
      signature.toString("hex").startsWith("89504e470d0a1a0a")
    ) &&
    !(
      file.type === "image/jpeg" &&
      signature.toString("hex").startsWith("ffd8ff")
    ) &&
    !(
      file.type === "image/webp" &&
      signature.subarray(0, 4).toString() === "RIFF" &&
      signature.subarray(8, 12).toString() === "WEBP"
    )
  )
    throw new Error(`${file.name}: the file does not match its format.`);
  return {
    bytes,
    type: file.type,
    name: file.name.replace(/[\r\n"\\]/g, "_").slice(0, 100),
  };
}
function addToLibrary(upload: Awaited<ReturnType<typeof readImage>>) {
  const state = getDemoState(),
    id = `site-${randomUUID()}`;
  state.images.set(id, upload);
  state.data.media = [
    ...(state.data.media ?? []),
    {
      id,
      fileName: upload.name,
      type: upload.type,
      size: upload.bytes.length,
      uploadedAt: new Date().toISOString(),
    },
  ];
  return id;
}
export async function uploadMedia(form: FormData) {
  const files = form
    .getAll("image")
    .filter((file): file is File => file instanceof File && file.size > 0);
  if (!files.length) throw new Error("Choose at least one image to upload.");
  if (files.length > 10) throw new Error("Upload up to 10 images at a time.");
  const uploads = await Promise.all(files.map(readImage));
  const ids = uploads.map(addToLibrary);
  return {
    id: ids.at(-1)!,
    message: `${ids.length} image${ids.length === 1 ? "" : "s"} added to the library.`,
  };
}
export async function deleteMedia(form: FormData) {
  const id = String(form.get("media") ?? ""),
    state = getDemoState();
  if (!mediaLibrary().some((item) => item.id === id && !item.builtin))
    throw new Error("Only uploaded images can be deleted.");
  const next = { ...state.data.siteImages };
  let released = 0;
  for (const [slot, saved] of Object.entries(next))
    if (saved.imageId === id) {
      delete next[slot];
      released++;
    }
  state.data.siteImages = next;
  state.data.media = (state.data.media ?? []).filter((file) => file.id !== id);
  state.images.delete(id);
  return released
    ? `Image deleted. ${released} placement${released === 1 ? "" : "s"} went back to the original image.`
    : "Image deleted.";
}
export async function updateSiteImage(form: FormData) {
  const id = String(form.get("slot") ?? "");
  if (!siteImageSlots().some((slot) => slot.id === id))
    throw new Error("Choose a valid page image.");
  const state = getDemoState(),
    previous = state.data.siteImages?.[id];
  const next = { ...state.data.siteImages };
  if (form.get("op") === "restore") {
    delete next[id];
    state.data.siteImages = next;
    return "Original image restored.";
  }
  const alt = String(form.get("alt") ?? "");
  const position = String(form.get("position") ?? "center");
  if (
    alt.length > 300 ||
    ![
      "center",
      "center top",
      "center 18%",
      "center 20%",
      "center 25%",
      "center 75%",
      "center bottom",
    ].includes(position)
  )
    throw new Error("Check the image description and focus.");
  const file = form.get("image");
  let mediaId = String(form.get("media") ?? "");
  if (file instanceof File && file.size)
    mediaId = addToLibrary(await readImage(file));
  const library = mediaLibrary();
  const chosen = mediaId
    ? library.find((item) => item.id === mediaId)
    : undefined;
  if (mediaId && !chosen) throw new Error("Choose an image from the library.");
  next[id] = chosen
    ? chosen.builtin
      ? { builtin: chosen.src, alt, position, fileName: chosen.fileName }
      : { imageId: chosen.id, alt, position, fileName: chosen.fileName }
    : { ...previous, alt, position };
  state.data.siteImages = next;
  return "Page image saved.";
}

/** Props for an event cover image (its own cover, or a default one). */
export const eventImageProps = (eventId: string) =>
  siteImageProps(`event.${eventId}`);
