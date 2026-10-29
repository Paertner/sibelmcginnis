// Loads the staged WordPress posts and podcast episodes into Supabase (safe to run again).
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
const postRows = posts.map((p, i) => ({
  id: p.id,
  title: p.title,
  access: p.access,
  status: p.status,
  category: p.category,
  cover: (i % 6) + 1,
  date: p.date,
  excerpt: p.excerpt,
  body: p.body,
  blocks: p.blocks,
}));
for (const [table, rows] of [["podcasts", episodeRows], ["posts", postRows]]) {
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(table, "failed:", error.message);
    process.exit(1);
  }
  console.log(`${table}: ${rows.length} saved`);
}
