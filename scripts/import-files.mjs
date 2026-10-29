// Copies the staged covers and podcast audio into the uploads folder and links them in Supabase.
// Safe to run again. Run it on the machine whose UPLOADS_DIR you want to fill (local, then hosting).
//   node --env-file=.env.local scripts/import-files.mjs ../import/staged
import { createClient } from "@supabase/supabase-js";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

const folder = process.argv[2];
if (!folder) {
  console.error("Usage: node --env-file=.env.local scripts/import-files.mjs <staged folder>");
  process.exit(1);
}
const { posts, podcasts } = JSON.parse(readFileSync(path.join(folder, "staged.json"), "utf8"));
const root = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), ".uploads"));
const types = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif",
  ".mp3": "audio/mpeg", ".mp4": "audio/mp4", ".m4a": "audio/mp4", ".wav": "audio/wav",
};
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function store(bucket, id, source) {
  const ext = path.extname(source).toLowerCase();
  const dir = path.join(root, bucket);
  mkdirSync(dir, { recursive: true });
  const indexFile = path.join(dir, "index.json");
  const index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, "utf8")) : {};
  // Reuse the stored copy when this id was already imported.
  const file = index[id]?.file ?? `${randomUUID()}${ext}`;
  copyFileSync(source, path.join(dir, file));
  const type = types[ext];
  if (!type) throw new Error(`Unknown file type: ${source}`);
  index[id] = { file, type, name: path.basename(source) };
  writeFileSync(indexFile, JSON.stringify(index, null, 1));
  return { type, size: statSync(source).size, name: path.basename(source) };
}

// Podcast audio: stored under the episode id.
for (const e of podcasts) {
  if (!e.audio_file) continue;
  store("audio", e.id, path.join(folder, "media", e.audio_file));
}
console.log(`audio: ${podcasts.filter((e) => e.audio_file).length} files`);

// Post covers: one library image per distinct file, linked to each post's cover slot.
const media = [];
const slots = {};
const seen = new Map();
for (const p of posts) {
  if (!p.cover_file) continue;
  const id = `site-wp-${p.cover_file.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
  if (!seen.has(id)) {
    const info = store("images", id, path.join(folder, "media", p.cover_file));
    seen.set(id, info);
    media.push({
      id, file_name: info.name, type: info.type, size: info.size, storage_path: id,
      uploaded_at: new Date().toISOString(),
    });
  }
  slots[`post.${p.id}`] = { imageId: id, alt: p.title, fileName: seen.get(id).name };
}
const { error: mediaError } = await db.from("media_files").upsert(media, { onConflict: "id" });
if (mediaError) throw new Error(mediaError.message);
const { data: existing } = await db.from("site_settings").select("value").eq("key", "siteImages").maybeSingle();
const { error: settingsError } = await db.from("site_settings").upsert({
  key: "siteImages",
  value: { ...(existing?.value ?? {}), ...slots },
  updated_at: new Date().toISOString(),
});
if (settingsError) throw new Error(settingsError.message);
console.log(`images: ${media.length} files linked to ${Object.keys(slots).length} posts`);
