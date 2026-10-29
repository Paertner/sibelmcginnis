import "server-only";
import seed from "./seed.json";
import type { EmailBlock, SavedEmailTemplate } from "./email-blocks";
import { addDays, nextSaturday, today } from "./dates";
import type { EmailPreferences } from "./email-preferences";

export type Member = (typeof seed)["members"][number] & {
  premiumUntil?: string;
  emailPreferences?: EmailPreferences;
};
export type Announcement = (typeof seed)["announcements"][number] & {
  /** What the email is about; members can turn each kind off. */
  category?: string;
  groups?: string[];
  recipientIds?: string[];
  html?: string;
  imageId?: string;
  emailStatus?: "prepared";
};
export type SiteSettings = {
  siteTitle?: string;
  tagline?: string;
  faviconPath?: string;
  contactEmail?: string;
  mailingAddress?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
};
/** Connection details. Secrets are never kept; only their last four characters. */
export type Integrations = {
  stripe?: {
    connected: boolean;
    accountName?: string;
    accountId?: string;
    connectedAt?: string;
  };
  zoom?: {
    accountId?: string;
    clientId?: string;
    secretTail?: string;
    savedAt?: string;
  };
  resend?: {
    fromName?: string;
    fromEmail?: string;
    keyTail?: string;
    savedAt?: string;
    dailyLimit?: number;
  };
};
export type MediaFile = {
  id: string;
  fileName: string;
  type: string;
  size: number;
  uploadedAt: string;
};
/** An in-person event. Members join with one button; attendees are member ids. */
export type EventItem = {
  id: string;
  title: string;
  status: "draft" | "published";
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, 24 hour */
  start: string;
  end: string;
  venue: string;
  address: string;
  mapUrl: string;
  seats: number;
  /** "Free" or a price such as "$35". Payment itself comes later. */
  price: string;
  summary: string;
  blocks: EmailBlock[];
  attendees: string[];
};
export type Store = Omit<
  typeof seed,
  "members" | "announcements" | "posts" | "sessions"
> & {
  posts: ((typeof seed)["posts"][number] & {
    blocks?: EmailBlock[];
    audioName?: string;
  })[];
  sessions: ((typeof seed)["sessions"][number] & {
    blocks?: EmailBlock[];
  })[];
  events?: EventItem[];
  siteCopy?: Record<string,string>;
  siteImages?: Record<string, {imageId?:string;builtin?:string;alt?:string;position?:string;fileName?:string}>;
  media?: MediaFile[];
  siteSettings?: SiteSettings;
  integrations?: Integrations;
  /** Emails sent on one UTC day, for the daily sending limit. */
  emailUsage?: { date: string; sent: number };
  emailTemplates?: SavedEmailTemplate[];
  emailFooter?: EmailBlock[];
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

const eventText = (id: string, html: string): EmailBlock => ({
  id,
  type: "text",
  html,
});
function sampleEvents(): EventItem[] {
  return [
    {
      id: "event-brunch",
      title: "Women’s Spring Brunch",
      status: "published",
      date: addDays(today(), 12),
      start: "10:00",
      end: "12:30",
      venue: "The Garden Room",
      address: "214 Maple Street, Austin, TX 78701",
      mapUrl: "https://maps.google.com/?q=214+Maple+Street+Austin+TX",
      seats: 12,
      price: "Free",
      summary:
        "A relaxed brunch to meet other women from the community, share a story and leave with one clear intention.",
      blocks: [
        eventText(
          "b1",
          "Join Sibel and the community for a relaxed brunch. We will share a table, a short guided reflection and a lot of laughter.",
        ),
        eventText(
          "b2",
          "<strong>What to expect</strong><br>A warm welcome, coffee and brunch, a short circle and time to connect.",
        ),
      ],
      attendees: ["m0", "m2", "m3", "m5", "m8"],
    },
    {
      id: "event-workshop",
      title: "Intention Setting Workshop",
      status: "published",
      date: addDays(today(), 26),
      start: "18:30",
      end: "20:30",
      venue: "Maple Studio",
      address: "88 Congress Avenue, Austin, TX 78701",
      mapUrl: "",
      seats: 3,
      price: "$35",
      summary:
        "A small hands-on evening workshop to set your intentions for the season. Only three seats.",
      blocks: [
        eventText(
          "w1",
          "A small, hands-on evening to turn your goals into simple weekly intentions. Bring a notebook.",
        ),
      ],
      attendees: ["m1", "m4", "m7"],
    },
    {
      id: "event-draft",
      title: "Holiday Coffee Morning",
      status: "draft",
      date: addDays(today(), 45),
      start: "09:30",
      end: "11:30",
      venue: "To be confirmed",
      address: "",
      mapUrl: "",
      seats: 20,
      price: "Free",
      summary: "A cozy coffee morning before the holidays.",
      blocks: [eventText("d1", "Details coming soon.")],
      attendees: [],
    },
    {
      id: "event-past",
      title: "Autumn Walk and Coffee",
      status: "published",
      date: addDays(today(), -20),
      start: "09:00",
      end: "11:00",
      venue: "Zilker Park Café",
      address: "2100 Barton Springs Road, Austin, TX 78746",
      mapUrl: "",
      seats: 15,
      price: "Free",
      summary: "A gentle walk followed by coffee and conversation.",
      blocks: [eventText("p1", "Thank you to everyone who joined us.")],
      attendees: ["m1", "m2", "m4", "m6", "m9", "m11"],
    },
  ];
}
function createFreshState(): DemoState {
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
  data.events = sampleEvents();
  return { data, audio: new Map(), images: new Map(), emailDrafts: [] };
}

/** Stage-one repository. Replace with Supabase; never use this process-local state for live customers. */
export function getDemoState() {
  const state = (globalStore.morningCoffeeDemo ??= normalize(createState()));
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
// Posts have two access levels now; older "free" posts are open to everyone.
function normalize(state: DemoState) {
  // Browsers that saved their sample data before Events existed get the sample events.
  if (!state.data.events) state.data.events = sampleEvents();
  for (const post of state.data.posts)
    if ((post.access as string) === "free") post.access = "public";
  return state;
}
export const getStore = () => getDemoState().data;
export const eventList = () => getStore().events ?? [];
export const demoEnabled = () =>
  true;
export const demoMeeting = (id: string) => `https://example.invalid/zoom/${id}`;
export const upcomingSessions = () =>
  getStore()
    .sessions.filter((s) => s.date >= today())
    .toSorted((a, b) => a.date.localeCompare(b.date));

const PREVIEW_KEY = "mcc-share-preview-v1";
let hydrateStoredImages = false;
function createState(): DemoState {
  try {
    const saved=JSON.parse(localStorage.getItem(PREVIEW_KEY)||"null");
    if(saved?.data?.settings && Array.isArray(saved.data.members) && Array.isArray(saved.data.posts)) {
      hydrateStoredImages = saved.imagesIndexed === true;
      return {
      data:saved.data,
      audio:new Map((saved.audio||[]).map(([id,asset]:[string,{bytes:number[];type:string}])=>[id,{...asset,bytes:new Uint8Array(asset.bytes)}])),
      images:new Map((saved.images||[]).map(([id,asset]:[string,{bytes:number[];type:string;name:string}])=>[id,{...asset,bytes:new Uint8Array(asset.bytes)}])),
      emailDrafts:saved.emailDrafts||[],
    }; }
  } catch { /* A private browser or old preview schema can start with fresh samples. */ }
  return createFreshState();
}
type StoredImage = {id:string;bytes:Uint8Array;type:string;name:string};
let mediaDatabase:Promise<IDBDatabase>|undefined;
let imageWrites:Promise<void> = Promise.resolve();
function imageDatabase() {
  return mediaDatabase ??= new Promise<IDBDatabase>((resolve,reject) => {
    const request = indexedDB.open("mcc-share-images-v1",1);
    request.onupgradeneeded = () => request.result.createObjectStore("images",{keyPath:"id"});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function hydratePreviewImages() {
  const state = getDemoState();
  if (!hydrateStoredImages) return;
  try {
    const db = await imageDatabase();
    const rows = await new Promise<StoredImage[]>((resolve,reject) => {
      const transaction = db.transaction("images","readonly");
      const request = transaction.objectStore("images").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    // Audio shares the media store under an "audio:" key so large files stay out of localStorage.
    for (const {id,...asset} of rows) {
      if (id.startsWith("audio:")) state.audio.set(id.slice(6),{type:asset.type,bytes:new Uint8Array(asset.bytes)});
      else state.images.set(id,{...asset,bytes:new Uint8Array(asset.bytes)});
    }
  } catch { window.dispatchEvent(new CustomEvent("preview-toast",{detail:"Saved images could not be loaded in this browser."})); }
}
export function persistPreview() {
  const state = getDemoState();
  const images = [...state.images].map(([id,asset]) => ({id,...asset}));
  const audio = [...state.audio].map(([id,asset]) => ({id:`audio:${id}`,name:"",...asset}));
  const snapshot = {data:structuredClone(state.data),emailDrafts:structuredClone(state.emailDrafts)};
  const warn = () => window.dispatchEvent(new CustomEvent("preview-toast",{detail:"Browser storage is full. Changes remain available in this tab."}));
  try { localStorage.setItem(PREVIEW_KEY,JSON.stringify({...snapshot,imagesIndexed:true})); } catch {warn();}
  imageWrites = imageWrites.then(async () => {
    try {
      const db = await imageDatabase();
      await new Promise<void>((resolve,reject) => {
        const transaction = db.transaction("images","readwrite"), store = transaction.objectStore("images");
        store.clear(); for (const row of [...images,...audio]) store.put(row);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } catch {
      try {localStorage.setItem(PREVIEW_KEY,JSON.stringify({...snapshot,images:images.map(({id,...asset}) => [id,{...asset,bytes:[...asset.bytes]}]),audio:[...state.audio].map(([id,asset])=>[id,{...asset,bytes:[...asset.bytes]}])}));} catch {warn();}
    }
  });
  return imageWrites;
}
export function resetPreview() { localStorage.removeItem(PREVIEW_KEY); globalStore.morningCoffeeDemo=normalize(createFreshState()); persistPreview(); }
