// Runs once when the server starts, before any request is served.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { usesDatabase, getDemoState } = await import("./lib/store");
  if (!usesDatabase()) return;
  const { loadFromDatabase, startAutosave } = await import("./lib/db");
  const state = getDemoState();
  const loaded = await loadFromDatabase();
  state.data = loaded;
  startAutosave(loaded);
  console.log(
    `[db] loaded ${loaded.members.length} members, ${loaded.posts.length} posts, ${loaded.podcasts.length} episodes`,
  );
}
