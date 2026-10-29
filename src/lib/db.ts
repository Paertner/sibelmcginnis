import "server-only";
import seed from "./seed.json";
import { adminClient, supabaseConfigured } from "./supabase";
import type { Store } from "./store";

/**
 * Keeps the in-memory store (what every page reads) in step with Supabase.
 * - loadFromDatabase() fills the store when the server starts.
 * - saveChanges() compares the store with what was last saved and writes only what changed.
 * Uploaded audio and images are handled separately (see file-storage.ts).
 */

type Row = Record<string, unknown>;
type Table = {
  name: string;
  /** Primary key columns. */
  key: string[];
  rows: (s: Store) => Row[];
  apply: (s: Store, rows: Row[]) => void;
};

const str = (v: unknown) => (v == null ? "" : String(v));
const nullIfEmpty = (v: unknown) => (v === "" || v == null ? null : v);
const day = (v: unknown) => str(v).slice(0, 10);

const tables: Table[] = [
  {
    name: "profiles",
    key: ["id"],
    // Admin accounts are not "members"; they are managed separately.
    rows: (s) =>
      s.members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        tier: m.tier,
        status: m.status,
        note: m.note ?? "",
        joined: m.joined,
        premium_until: nullIfEmpty(m.premiumUntil),
        email_preferences: m.emailPreferences ?? {},
      })),
    apply: (s, rows) => {
      s.members = rows
        .filter((r) => r.role !== "admin")
        .map((r) => ({
          id: str(r.id),
          name: str(r.name),
          email: str(r.email),
          tier: str(r.tier),
          status: str(r.status),
          note: str(r.note),
          joined: day(r.joined),
          premiumUntil: r.premium_until ? str(r.premium_until) : undefined,
          emailPreferences: (r.email_preferences ?? {}) as never,
        })) as never;
    },
  },
  {
    name: "podcasts",
    key: ["id"],
    rows: (s) =>
      s.podcasts.map((p) => ({
        id: p.id,
        num: p.num,
        title: p.title,
        status: p.status,
        duration: p.duration ?? "",
        audio_name: p.audioName ?? "",
        date: p.date,
        description: p.description ?? "",
      })),
    apply: (s, rows) => {
      s.podcasts = rows.map((r) => ({
        id: str(r.id),
        num: Number(r.num),
        title: str(r.title),
        status: str(r.status),
        duration: str(r.duration),
        audioName: str(r.audio_name),
        date: day(r.date),
        description: str(r.description),
      })) as never;
    },
  },
  {
    name: "posts",
    key: ["id"],
    rows: (s) =>
      s.posts.map((p) => ({
        id: p.id,
        title: p.title,
        access: p.access,
        status: p.status,
        category: p.category ?? "",
        cover: p.cover ?? 1,
        date: p.date,
        excerpt: p.excerpt ?? "",
        body: p.body ?? "",
        blocks: p.blocks ?? [],
        audio_name: nullIfEmpty(p.audioName),
      })),
    apply: (s, rows) => {
      s.posts = rows.map((r) => ({
        id: str(r.id),
        title: str(r.title),
        access: str(r.access),
        status: str(r.status),
        category: str(r.category),
        cover: Number(r.cover),
        date: day(r.date),
        excerpt: str(r.excerpt),
        body: str(r.body),
        blocks: (r.blocks ?? []) as never,
        audioName: r.audio_name ? str(r.audio_name) : undefined,
      })) as never;
    },
  },
  {
    name: "sessions",
    key: ["id"],
    rows: (s) =>
      s.sessions.map((x) => ({
        id: x.id,
        date: x.date,
        time: x.time,
        topic: x.topic ?? "",
        notes: x.notes ?? "",
        blocks: x.blocks ?? [],
        zoom_meeting_id: nullIfEmpty(x.zoomId),
        zoom_url: nullIfEmpty(x.zoom),
        zoom_pass: nullIfEmpty(x.pass),
        podcast_id: s.podcasts.some((p) => p.id === x.podcast)
          ? x.podcast
          : null,
      })),
    apply: (s, rows) => {
      s.sessions = rows.map((r) => ({
        id: str(r.id),
        date: day(r.date),
        time: str(r.time),
        topic: str(r.topic),
        notes: str(r.notes),
        blocks: (r.blocks ?? []) as never,
        zoom: str(r.zoom_url),
        pass: str(r.zoom_pass),
        ...(r.zoom_meeting_id ? { zoomId: str(r.zoom_meeting_id) } : {}),
        podcast: str(r.podcast_id),
      })) as never;
    },
  },
  {
    name: "events",
    key: ["id"],
    rows: (s) =>
      (s.events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        date: e.date,
        start_time: e.start,
        end_time: e.end,
        venue: e.venue,
        address: e.address,
        map_url: e.mapUrl,
        seats: e.seats,
        price: e.price,
        summary: e.summary,
        blocks: e.blocks ?? [],
      })),
    apply: (s, rows) => {
      s.events = rows.map((r) => ({
        id: str(r.id),
        title: str(r.title),
        status: str(r.status),
        date: day(r.date),
        start: str(r.start_time),
        end: str(r.end_time),
        venue: str(r.venue),
        address: str(r.address),
        mapUrl: str(r.map_url),
        seats: Number(r.seats),
        price: str(r.price),
        summary: str(r.summary),
        blocks: (r.blocks ?? []) as never,
        attendees: [],
      })) as never;
    },
  },
  {
    name: "event_attendees",
    key: ["event_id", "member_id"],
    rows: (s) =>
      (s.events ?? []).flatMap((e) =>
        e.attendees.map((member_id) => ({ event_id: e.id, member_id })),
      ),
    apply: (s, rows) => {
      for (const r of rows)
        s.events
          ?.find((e) => e.id === r.event_id)
          ?.attendees.push(str(r.member_id));
    },
  },
  {
    name: "availability",
    key: ["weekday"],
    rows: (s) =>
      Object.entries(s.availability as Record<string, string[]>).map(
        ([weekday, times]) => ({ weekday: Number(weekday), times }),
      ),
    apply: (s, rows) => {
      const found: Record<string, string[]> = {};
      for (const r of rows) found[str(r.weekday)] = (r.times ?? []) as string[];
      if (rows.length) s.availability = found as never;
    },
  },
  {
    name: "bookings",
    key: ["id"],
    rows: (s) =>
      s.bookings.map((b) => ({
        id: b.id,
        member_id: nullIfEmpty(b.memberId),
        date: b.date,
        time: b.time,
        topic: b.topic ?? "",
        status: b.status,
        zoom_meeting_id: nullIfEmpty(b.zoomId),
        zoom_url: nullIfEmpty(b.zoom),
        source: b.source ?? null,
        company: b.company ?? null,
        contact: b.contact ?? null,
        email: b.email ?? null,
        phone: b.phone ?? null,
        link_id: nullIfEmpty(b.linkId),
        created_at: b.createdAt ?? new Date().toISOString(),
      })),
    apply: (s, rows) => {
      s.bookings = rows.map((r) => ({
        id: str(r.id),
        memberId: str(r.member_id),
        date: day(r.date),
        time: str(r.time),
        topic: str(r.topic),
        status: str(r.status),
        zoom: str(r.zoom_url),
        ...(r.zoom_meeting_id ? { zoomId: str(r.zoom_meeting_id) } : {}),
        ...(r.source ? { source: "company" } : {}),
        ...(r.company ? { company: str(r.company) } : {}),
        ...(r.contact ? { contact: str(r.contact) } : {}),
        ...(r.email ? { email: str(r.email) } : {}),
        ...(r.phone ? { phone: str(r.phone) } : {}),
        ...(r.link_id ? { linkId: str(r.link_id) } : {}),
        createdAt: str(r.created_at),
      })) as never;
    },
  },
  {
    name: "company_links",
    key: ["id"],
    rows: (s) =>
      (s.companyLinks ?? []).map((l) => ({
        id: l.id,
        token: l.token,
        label: l.label,
        created_at: l.createdAt,
        expires_at: l.expiresAt,
        revoked: !!l.revoked,
        booking_id: nullIfEmpty(l.bookingId),
      })),
    apply: (s, rows) => {
      s.companyLinks = rows.map((r) => ({
        id: str(r.id),
        token: str(r.token),
        label: str(r.label),
        createdAt: day(r.created_at),
        expiresAt: day(r.expires_at),
        ...(r.revoked ? { revoked: true } : {}),
        ...(r.booking_id ? { bookingId: str(r.booking_id) } : {}),
      }));
    },
  },
  {
    name: "admin_notices",
    key: ["id"],
    rows: (s) =>
      (s.notices ?? []).map((n) => ({
        id: n.id,
        kind: n.kind,
        booking_id: n.bookingId,
        seen: n.seen,
        created_at: n.createdAt,
      })),
    apply: (s, rows) => {
      s.notices = rows.map((r) => ({
        id: str(r.id),
        kind: "company-booking" as const,
        bookingId: str(r.booking_id),
        createdAt: str(r.created_at),
        seen: !!r.seen,
      }));
    },
  },
  {
    name: "announcements",
    key: ["id"],
    rows: (s) =>
      s.announcements.map((a) => ({
        id: a.id,
        subject: a.subject,
        audience: a.audience,
        category: a.category ?? null,
        groups: a.groups ?? [],
        recipient_ids: a.recipientIds ?? [],
        date: a.date,
        body: a.body ?? "",
        html: a.html ?? null,
        image_id: a.imageId ?? null,
        email_status: a.emailStatus ?? null,
      })),
    apply: (s, rows) => {
      s.announcements = rows.map((r) => ({
        id: str(r.id),
        subject: str(r.subject),
        audience: str(r.audience),
        date: day(r.date),
        body: str(r.body),
        ...(r.category ? { category: str(r.category) } : {}),
        groups: (r.groups ?? []) as string[],
        recipientIds: (r.recipient_ids ?? []) as string[],
        ...(r.html ? { html: str(r.html) } : {}),
        ...(r.image_id ? { imageId: str(r.image_id) } : {}),
        ...(r.email_status ? { emailStatus: "prepared" as const } : {}),
      })) as never;
    },
  },
  {
    name: "media_files",
    key: ["id"],
    rows: (s) =>
      (s.media ?? []).map((m) => ({
        id: m.id,
        file_name: m.fileName,
        type: m.type,
        size: m.size,
        storage_path: m.id,
        uploaded_at: m.uploadedAt,
      })),
    apply: (s, rows) => {
      s.media = rows.map((r) => ({
        id: str(r.id),
        fileName: str(r.file_name),
        type: str(r.type),
        size: Number(r.size),
        uploadedAt: str(r.uploaded_at),
      }));
    },
  },
];

/** Single values (site settings, copy edits, templates...) kept in site_settings. */
const settingKeys = [
  "settings",
  "siteCopy",
  "siteImages",
  "siteSettings",
  "integrations",
  "emailUsage",
  "emailTemplates",
  "emailFooter",
] as const;

type Saved = Map<string, Map<string, string>>;
const globals = globalThis as typeof globalThis & {
  mccSaved?: Saved;
  mccSaving?: Promise<void>;
  mccTimer?: ReturnType<typeof setInterval>;
};
const saved = () => (globals.mccSaved ??= new Map());
const keyOf = (t: Table, r: Row) => t.key.map((k) => str(r[k])).join("|");
const fingerprint = (r: Row) => JSON.stringify(r);

/** An empty store with the built-in defaults, ready to be filled from the database. */
export function emptyStore(): Store {
  const base = structuredClone(seed) as unknown as Store;
  base.members = [];
  base.posts = [];
  base.podcasts = [];
  base.sessions = [];
  base.bookings = [];
  base.announcements = [];
  base.events = [];
  base.companyLinks = [];
  base.notices = [];
  base.media = [];
  return base;
}

async function selectAll(name: string): Promise<Row[]> {
  const { data, error } = await adminClient().from(name).select("*");
  if (error) throw new Error(`Could not read ${name}: ${error.message}`);
  return (data ?? []) as Row[];
}

export async function loadFromDatabase(): Promise<Store> {
  const store = emptyStore();
  for (const t of tables) {
    t.apply(store, await selectAll(t.name));
  }
  const { data: kv } = await adminClient().from("site_settings").select("*");
  for (const { key, value } of kv ?? [])
    if ((settingKeys as readonly string[]).includes(key))
      (store as Record<string, unknown>)[key] = value;
  // Everything just loaded counts as saved.
  snapshot(store);
  return store;
}

function snapshot(store: Store) {
  for (const t of tables)
    saved().set(
      t.name,
      new Map(t.rows(store).map((r) => [keyOf(t, r), fingerprint(r)])),
    );
  saved().set(
    "site_settings",
    new Map(
      settingKeys.map((k) => [
        k,
        JSON.stringify((store as Record<string, unknown>)[k] ?? null),
      ]),
    ),
  );
}

/** Re-reads the member list, e.g. after someone signs up. */
export async function reloadMembers(store: Store) {
  const t = tables[0];
  const rows = await selectAll(t.name);
  t.apply(store, rows);
  saved().set(
    t.name,
    new Map(t.rows(store).map((r) => [keyOf(t, r), fingerprint(r)])),
  );
}

async function writeChanges(store: Store) {
  const db = adminClient();
  const state = saved();
  const log = (what: string, message: string) =>
    console.error(`[db] ${what}: ${message}`);

  const previous = new Map(state);
  // Parents first: members and podcasts, then everything that points at them.
  for (const t of tables) {
    const before = state.get(t.name) ?? new Map<string, string>();
    const rows = t.rows(store);
    const now = new Map(rows.map((r) => [keyOf(t, r), fingerprint(r)]));
    let changed = rows.filter(
      (r) => before.get(keyOf(t, r)) !== now.get(keyOf(t, r)),
    );
    // Company links and bookings point at each other: write links without the booking first.
    if (t.name === "company_links")
      changed = changed.map((r) => ({ ...r, booking_id: null }));
    if (changed.length) {
      const { error } = await db
        .from(t.name)
        .upsert(changed, { onConflict: t.key.join(",") });
      if (error) {
        log(t.name, error.message);
        continue; // try again next time; keep the old fingerprint
      }
    }
    if (t.name === "bookings") {
      const links = tables.find((x) => x.name === "company_links")!;
      const linked = links.rows(store).filter((r) => r.booking_id);
      for (const l of linked)
        await db
          .from("company_links")
          .update({ booking_id: l.booking_id })
          .eq("id", l.id);
    }
    state.set(t.name, now);
  }
  // Removed rows, children first. Only rows we know were saved can be removed.
  for (const t of [...tables].reverse()) {
    const kept = new Set(t.rows(store).map((r) => keyOf(t, r)));
    for (const k of previous.get(t.name)?.keys() ?? []) {
      if (kept.has(k)) continue;
      const parts = k.split("|");
      let q = db.from(t.name).delete();
      t.key.forEach((col, i) => (q = q.eq(col, parts[i])));
      const { error } = await q;
      if (error) log(`${t.name} delete`, error.message);
    }
  }
  // Single values.
  const before = state.get("site_settings") ?? new Map<string, string>();
  const nowSettings = new Map<string, string>();
  const changedSettings: { key: string; value: unknown }[] = [];
  for (const k of settingKeys) {
    const value = (store as Record<string, unknown>)[k] ?? null;
    const text = JSON.stringify(value);
    nowSettings.set(k, text);
    if (before.get(k) !== text) changedSettings.push({ key: k, value });
  }
  if (changedSettings.length) {
    const { error } = await db.from("site_settings").upsert(
      changedSettings.map((c) => ({
        ...c,
        updated_at: new Date().toISOString(),
      })),
    );
    if (error) {
      log("site_settings", error.message);
      return;
    }
  }
  state.set("site_settings", nowSettings);
}

/** Writes any changes now. Calls queue up so two saves never overlap. */
export function saveChanges(store: Store): Promise<void> {
  if (!supabaseConfigured()) return Promise.resolve();
  const run = () =>
    writeChanges(store).catch((e) => console.error("[db] save failed", e));
  globals.mccSaving = (globals.mccSaving ?? Promise.resolve()).then(run);
  return globals.mccSaving;
}

/** Saves shortly after every change, and again every few seconds as a safety net. */
export function startAutosave(store: Store) {
  if (globals.mccTimer) return;
  let last = "";
  globals.mccTimer = setInterval(() => {
    const now = JSON.stringify([
      tables.map((t) => t.rows(store)),
      settingKeys.map((k) => (store as Record<string, unknown>)[k] ?? null),
    ]);
    if (now === last) return;
    last = now;
    void saveChanges(store);
  }, 1000);
}
