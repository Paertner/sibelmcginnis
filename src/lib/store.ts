import "server-only";
import seed from "./seed.json";
import { addDays, nextSaturday, today } from "./dates";

export type Member = (typeof seed)["members"][number] & {
  premiumUntil?: string;
};
export type Announcement = (typeof seed)["announcements"][number] & {
  groups?: string[];
  recipientIds?: string[];
  html?: string;
  imageId?: string;
  emailStatus?: "prepared";
};
export type Store = Omit<typeof seed, "members" | "announcements"> & {
  siteCopy?: Record<string, string>;
  siteImages?: Record<
    string,
    { imageId?: string; alt?: string; position?: string; fileName?: string }
  >;
  members: Member[];
  announcements: Announcement[];
};
export type Post = Store["posts"][number];
export type Session = Store["sessions"][number];
export type Booking = Store["bookings"][number];
export type Episode = Store["podcasts"][number];
type DemoState = {
  data: Store;
  audio: Map<string, { bytes: Uint8Array; type: string }>;
  images: Map<string, { bytes: Uint8Array; type: string; name: string }>;
  emailDrafts: {
    id: string;
    announcementId: string;
    memberId: string;
    to: string;
    name: string;
    subject: string;
  }[];
};
const globalStore = globalThis as typeof globalThis & {
  morningCoffeeDemo?: DemoState;
};

function createState(): DemoState {
  const data: Store = structuredClone(seed);
  const anchor = seed.sessions[4].date;
  const dayShift = Math.round(
    (Date.parse(today()) - Date.parse(addDays(seed.posts[0].date, 3))) /
      86400000,
  );
  for (const item of [
    ...data.posts,
    ...data.podcasts,
    ...data.bookings,
    ...data.announcements,
  ])
    item.date = addDays(item.date, dayShift);
  for (const member of data.members)
    member.joined = addDays(member.joined, dayShift);
  for (const session of data.sessions) {
    const weeks = Math.round(
      (Date.parse(session.date) - Date.parse(anchor)) / (7 * 86400000),
    );
    session.date = nextSaturday(weeks);
  }
  for (const member of data.members)
    if (member.tier === "premium")
      member.premiumUntil = new Date(Date.now() + 30 * 86400000).toISOString();
  return { data, audio: new Map(), images: new Map(), emailDrafts: [] };
}

/** Stage-one repository. Replace with Supabase; never use this process-local state for live customers. */
export function getDemoState() {
  const state = (globalStore.morningCoffeeDemo ??= createState());
  // Upgrade a running development preview without throwing away its edits.
  if (!state.images) {
    state.images = new Map();
    state.emailDrafts = [];
    for (const member of state.data.members)
      if (member.tier === "premium" && !member.premiumUntil)
        member.premiumUntil = new Date(
          Date.now() + 30 * 86400000,
        ).toISOString();
  }
  return state;
}
export const getStore = () => getDemoState().data;
export const demoEnabled = () =>
  process.env.NODE_ENV === "development" && process.env.DEMO_MODE !== "false";
export const demoMeeting = (id: string) => `https://example.invalid/zoom/${id}`;
export const upcomingSessions = () =>
  getStore()
    .sessions.filter((s) => s.date >= today())
    .toSorted((a, b) => a.date.localeCompare(b.date));
