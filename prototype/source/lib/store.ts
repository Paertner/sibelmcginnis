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
export type MediaFile = {
  id: string;
  fileName: string;
  type: string;
  size: number;
  uploadedAt: string;
};
export type Store = Omit<typeof seed, "members" | "announcements"> & {
  siteCopy?: Record<string,string>;
  siteImages?: Record<string, {imageId?:string;builtin?:string;alt?:string;position?:string;fileName?:string}>;
  media?: MediaFile[];
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
    for (const {id,...asset} of rows) state.images.set(id,{...asset,bytes:new Uint8Array(asset.bytes)});
  } catch { window.dispatchEvent(new CustomEvent("preview-toast",{detail:"Saved images could not be loaded in this browser."})); }
}
export function persistPreview() {
  const state = getDemoState();
  const images = [...state.images].map(([id,asset]) => ({id,...asset}));
  const snapshot = {data:structuredClone(state.data),emailDrafts:structuredClone(state.emailDrafts),audio:[...state.audio].map(([id,asset])=>[id,{...asset,bytes:[...asset.bytes]}])};
  const warn = () => window.dispatchEvent(new CustomEvent("preview-toast",{detail:"Browser storage is full. Changes remain available in this tab."}));
  try { localStorage.setItem(PREVIEW_KEY,JSON.stringify({...snapshot,imagesIndexed:true})); } catch {warn();}
  imageWrites = imageWrites.then(async () => {
    try {
      const db = await imageDatabase();
      await new Promise<void>((resolve,reject) => {
        const transaction = db.transaction("images","readwrite"), store = transaction.objectStore("images");
        store.clear(); for (const image of images) store.put(image);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } catch {
      try {localStorage.setItem(PREVIEW_KEY,JSON.stringify({...snapshot,images:images.map(({id,...asset}) => [id,{...asset,bytes:[...asset.bytes]}])}));} catch {warn();}
    }
  });
  return imageWrites;
}
export function resetPreview() { localStorage.removeItem(PREVIEW_KEY); globalStore.morningCoffeeDemo=createFreshState(); persistPreview(); }
