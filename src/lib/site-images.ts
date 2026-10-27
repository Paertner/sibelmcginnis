import "server-only";
import { randomUUID } from "node:crypto";
import { getDemoState, getStore, type Post } from "./store";
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
  ];
}
export type SiteImage = ImageSlot & {
  src: string;
  alt: string;
  position: string;
  custom: boolean;
  fileName: string;
};
export function siteImage(id: string): SiteImage {
  const slot = siteImageSlots().find((entry) => entry.id === id);
  if (!slot) throw new Error("Unknown page image.");
  const saved = getStore().siteImages?.[id];
  const post = slot.postId
    ? getStore().posts.find((post) => post.id === slot.postId)
    : undefined;
  const base = post ? siteImage(`blog.cover-${post.cover % 3}`) : undefined;
  return {
    ...slot,
    src: saved?.imageId
      ? `/api/site-image/${saved.imageId}`
      : (base?.src ?? slot.src),
    alt: saved?.alt ?? (slot.altCopyId ? siteText(slot.altCopyId) : slot.alt),
    position: saved?.position ?? base?.position ?? slot.position,
    custom: !!saved?.imageId || !!base?.custom,
    fileName: saved?.fileName ?? base?.fileName ?? "",
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
    if (previous?.imageId) state.images.delete(previous.imageId);
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
  let upload: { bytes: Uint8Array; type: string; name: string } | undefined;
  if (file instanceof File && file.size) {
    if (
      file.size > 3 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    )
      throw new Error("Choose a JPG, PNG or WebP image up to 3 MB.");
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
      throw new Error("The image file does not match its format.");
    upload = {
      bytes,
      type: file.type,
      name: file.name.replace(/[\r\n"\\]/g, "_").slice(0, 100),
    };
  }
  const imageId = upload ? `site-${randomUUID()}` : previous?.imageId;
  next[id] = {
    imageId,
    alt,
    position,
    fileName: upload?.name ?? previous?.fileName,
  };
  if (upload && imageId) state.images.set(imageId, upload);
  state.data.siteImages = next;
  if (upload && previous?.imageId) state.images.delete(previous.imageId);
  return "Page image saved.";
}
