// Loads the staged WordPress content into Supabase (safe to run again).
//   Blog posts       -> posts (Everyone)
//   Meeting summaries -> past Saturday sessions (their notes), linked to the matching podcast episode
//   Podcast playlists -> podcast episodes
// Covers that only belonged to summaries are removed from the media library.
//   node --env-file=.env.local scripts/load-staged.mjs ../import/staged/staged.json
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/load-staged.mjs <staged.json>");
  process.exit(1);
}
const { posts, podcasts } = JSON.parse(readFileSync(file, "utf8"));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const fail = (what, error) => {
  console.error(what, "failed:", error.message);
  process.exit(1);
};
const norm = (t) => t.toLowerCase().replace(/\W+/g, "");

// --- Dates: the Saturday on or before a day, then one session per Saturday. ---
const day = (iso) => new Date(iso + "T12:00:00Z");
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const saturdayOnOrBefore = (date) => {
  const d = day(date);
  return addDays(d, -((d.getUTCDay() + 1) % 7));
};
const summaries = posts
  .filter((p) => p.access === "premium")
  .toSorted((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
// Latest first: each keeps its own Saturday, and an earlier one that would share it moves a week back.
const taken = new Set();
const sessionDate = new Map();
for (const p of summaries.toReversed()) {
  let d = saturdayOnOrBefore(p.date);
  while (taken.has(iso(d))) d = addDays(d, -7);
  taken.add(iso(d));
  sessionDate.set(p.id, iso(d));
}

const episodeByTitle = new Map(podcasts.map((e) => [norm(e.title), e.id]));
const episodeRows = podcasts.map((p) => ({
  id: p.id,
  num: p.num,
  title: p.title,
  status: p.status,
  duration: "",
  audio_name: p.audio_file,
  date: p.date,
  description: p.description,
}));
const publicPosts = posts.filter((p) => p.access === "public");
const postRows = publicPosts.map((p, i) => ({
  id: p.id,
  title: p.title,
  access: "public",
  status: p.status,
  category: p.category,
  cover: (i % 6) + 1,
  date: p.date,
  excerpt: p.excerpt,
  body: p.body,
  blocks: p.blocks,
}));
const sessionRows = summaries.map((p) => ({
  id: p.id,
  date: sessionDate.get(p.id),
  time: "10:30",
  topic: p.title,
  notes: p.body,
  blocks: p.blocks,
  podcast_id: episodeByTitle.get(norm(p.title)) ?? null,
}));

for (const [table, rows] of [
  ["podcasts", episodeRows],
  ["posts", postRows],
  ["sessions", sessionRows],
]) {
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) fail(table, error);
  console.log(`${table}: ${rows.length} saved`);
}

// --- Remove the summaries from the blog, and their covers from the library. ---
const gone = summaries.map((p) => p.id);
{
  const { error } = await db.from("posts").delete().in("id", gone);
  if (error) fail("posts cleanup", error);
}
const stillUsed = new Set(publicPosts.map((p) => p.cover_file).filter(Boolean));
const orphanFiles = [...new Set(summaries.map((p) => p.cover_file).filter(Boolean))].filter(
  (f) => !stillUsed.has(f),
);
const mediaId = (f) => `site-wp-${f.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
if (orphanFiles.length) {
  const { error } = await db.from("media_files").delete().in("id", orphanFiles.map(mediaId));
  if (error) fail("media cleanup", error);
}
const { data: current } = await db.from("site_settings").select("value").eq("key", "siteImages").maybeSingle();
const images = { ...(current?.value ?? {}) };
for (const id of gone) delete images[`post.${id}`];
const { error: imagesError } = await db
  .from("site_settings")
  .upsert({ key: "siteImages", value: images, updated_at: new Date().toISOString() });
if (imagesError) fail("siteImages", imagesError);
console.log(`removed ${gone.length} summaries from posts and ${orphanFiles.length} unused covers`);
