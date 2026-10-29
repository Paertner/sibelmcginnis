import "server-only";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Uploaded audio and images live on the hosting disk, in a folder that is NOT part of the
 * deployed app, so a new deploy never replaces them. Set UPLOADS_DIR to a folder outside the
 * app (for example /home/<user>/mcc-uploads). The database keeps only the name, size and path.
 */
export type Bucket = "audio" | "images";

function root() {
  const app = process.cwd();
  const dir = path.resolve(
    process.env.UPLOADS_DIR || path.join(app, ".uploads"),
  );
  // A deploy replaces the app folder, so in production uploads must live outside it.
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.UPLOADS_DIR || dir === app || dir.startsWith(app + path.sep))
  )
    throw new Error(
      "Set UPLOADS_DIR to a folder outside the app so deploys never delete uploads.",
    );
  return dir;
}

/** Paths are stored relative to the bucket, like "3f2a....mp3". Never trust one from a request. */
function resolve(bucket: Bucket, key: string) {
  const base = path.join(root(), bucket);
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw new Error("Invalid file path.");
  return full;
}

const extension = (name: string) => {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
};

/** Saves the bytes under a new random name and returns that name (the "key"). */
export async function saveFile(
  bucket: Bucket,
  bytes: Uint8Array,
  originalName: string,
) {
  const key = `${randomUUID()}${extension(originalName)}`;
  const full = resolve(bucket, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return key;
}

export async function deleteFile(bucket: Bucket, key: string) {
  await rm(resolve(bucket, key), { force: true });
}

/** Size, plus a stream for the whole file or a byte range (for seeking in audio). */
export async function openFile(
  bucket: Bucket,
  key: string,
  range?: { start: number; end: number },
) {
  const full = resolve(bucket, key);
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) return null;
  return {
    size: info.size,
    stream: createReadStream(full, range),
  };
}
