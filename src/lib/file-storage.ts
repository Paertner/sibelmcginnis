import "server-only";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Uploaded audio and images live on the hosting disk, in a folder that is NOT part of the
 * deployed app, so a new deploy never replaces them. Set UPLOADS_DIR to a folder outside the
 * app (for example /home/<user>/mcc-uploads).
 *
 * DiskMap has the same shape as the in-memory Map the demo uses (has / get / set / delete),
 * so the rest of the app does not need to know where files are kept.
 */
export type Upload = { bytes: Uint8Array; type: string; name: string };
type Entry = { file: string; type: string; name: string };
/** What get() returns: bytes are read from disk only when they are used. */
export type StoredUpload = {
  type: string;
  name: string;
  size: number;
  readonly bytes: Uint8Array;
};

export function uploadsRoot() {
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

const extension = (name: string) => {
  const ext = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
};

export class DiskMap extends Map<string, Upload> {
  private index: Record<string, Entry> | undefined;
  constructor(private bucket: "audio" | "images") {
    super();
  }
  private dir() {
    return path.join(uploadsRoot(), this.bucket);
  }
  private indexFile() {
    return path.join(this.dir(), "index.json");
  }
  private load() {
    if (!this.index)
      this.index = existsSync(this.indexFile())
        ? JSON.parse(readFileSync(this.indexFile(), "utf8"))
        : {};
    return this.index!;
  }
  private save() {
    mkdirSync(this.dir(), { recursive: true });
    writeFileSync(this.indexFile(), JSON.stringify(this.index, null, 1));
  }
  /** A stored file's path; never trusts the name to stay inside the folder. */
  private filePath(entry: Entry) {
    const full = path.resolve(this.dir(), entry.file);
    if (!full.startsWith(this.dir() + path.sep))
      throw new Error("Invalid file path.");
    return full;
  }
  override has(id: string) {
    return !!this.load()[id];
  }
  override get(id: string): StoredUpload | undefined {
    const entry = this.load()[id];
    if (!entry) return undefined;
    const full = this.filePath(entry);
    if (!existsSync(full)) return undefined;
    return {
      type: entry.type,
      name: entry.name,
      size: statSync(full).size,
      get bytes() {
        return readFileSync(full);
      },
    };
  }
  override set(id: string, upload: Upload) {
    const index = this.load();
    const previous = index[id];
    const file = `${randomUUID()}${extension(upload.name)}`;
    mkdirSync(this.dir(), { recursive: true });
    writeFileSync(path.join(this.dir(), file), upload.bytes);
    index[id] = { file, type: upload.type, name: upload.name };
    this.save();
    if (previous) rmSync(this.filePath(previous), { force: true });
    return this;
  }
  override delete(id: string) {
    const index = this.load();
    const entry = index[id];
    if (!entry) return false;
    rmSync(this.filePath(entry), { force: true });
    delete index[id];
    this.save();
    return true;
  }
}
