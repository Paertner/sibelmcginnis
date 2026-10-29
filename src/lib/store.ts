import "server-only";
import seed from "./seed.json";
import type { EmailBlock, SavedEmailTemplate } from "./email-blocks";
import { addDays, nextSaturday, today } from "./dates";
import type { EmailPreferences } from "./email-preferences";
import { emptyStore } from "./db";
import { DiskMap } from "./file-storage";
import { supabaseConfigured } from "./supabase";

export type Member = (typeof seed)["members"][number] & {
  stripeCustomerId?: string;
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
    mode?: "test" | "live";
    /** The webhook signing secret has been saved. */
    webhookSaved?: boolean;
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
/** A consultation. Company bookings have no member: they carry the company's details instead. */
export type Booking = (typeof seed)["bookings"][number] & {
  /** Zoom meeting id, when the meeting was made through Zoom. */
  zoomId?: string;
  source?: "company";
  company?: string;
  contact?: string;
  email?: string;
  phone?: string;
  linkId?: string;
  createdAt?: string;
};
/** A one-booking link the admin sends to a company. The link is the only credential. */
export type CompanyLink = {
  id: string;
  /** Random, unguessable text used in the address: /company/<token> */
  token: string;
  label: string;
  createdAt: string;
  /** YYYY-MM-DD, the last day the link works */
  expiresAt: string;
  revoked?: boolean;
  /** Set when the company has booked; the link cannot be used again. */
  bookingId?: string;
};
/** Something the admin should see until it is dismissed. */
export type AdminNotice = {
  id: string;
  kind: "company-booking";
  bookingId: string;
  createdAt: string;
  seen: boolean;
};
export type Store = Omit<
  typeof seed,
  "members" | "announcements" | "posts" | "sessions" | "bookings"
> & {
  bookings: Booking[];
  companyLinks?: CompanyLink[];
  notices?: AdminNotice[];
  posts: ((typeof seed)["posts"][number] & {
    blocks?: EmailBlock[];
    audioName?: string;
  })[];
  sessions: ((typeof seed)["sessions"][number] & {
    zoomId?: string;
    blocks?: EmailBlock[];
  })[];
  events?: EventItem[];
  siteCopy?: Record<string, string>;
  siteImages?: Record<
    string,
    {
      imageId?: string;
      builtin?: string;
      alt?: string;
      position?: string;
      fileName?: string;
    }
  >;
  media?: MediaFile[];
  siteSettings?: SiteSettings;
  integrations?: Integrations;
  /** Encrypted keys typed into Settings. Never sent to the browser. */
  secretsVault?: Record<string, string>;
  /** Emails sent on one UTC day, for the daily sending limit. */
  emailUsage?: { date: string; sent: number };
  emailTemplates?: SavedEmailTemplate[];
  emailFooter?: EmailBlock[];
  members: Member[];
  announcements: Announcement[];
};
export type Post = Store["posts"][number];
export type Session = Store["sessions"][number];
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
/** With Supabase connected and demo mode off, data lives in the database. */
export const usesDatabase = () => !demoEnabled() && supabaseConfigured();
function createState(): DemoState {
  // The real data is loaded from the database when the server starts (instrumentation.ts).
  if (usesDatabase())
    return {
      data: emptyStore(),
      // Files live on the hosting disk, outside the deployed app.
      audio: new DiskMap("audio") as unknown as DemoState["audio"],
      images: new DiskMap("images") as unknown as DemoState["images"],
      emailDrafts: [],
    };
  const data: Store = structuredClone(seed);
  // Posts have two access levels; earlier "free" posts are open to everyone.
  for (const post of data.posts)
    if ((post.access as string) === "free") post.access = "public";
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
  sampleCompany(data);
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
const clockMinutes = (t: string) =>
  Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
/** Three sample links: one waiting, one already used, one expired. */
function sampleCompany(data: Store) {
  let date = "",
    time = "";
  for (let i = 3; i <= 21 && !date; i++) {
    const day = addDays(today(), i);
    const free = (
      (data.availability as Record<string, string[]>)[
        new Date(day + "T12:00:00Z").getUTCDay()
      ] ?? []
    ).find(
      (t) =>
        !data.bookings.some(
          (b) =>
            b.status !== "cancelled" &&
            b.date === day &&
            Math.abs(clockMinutes(b.time) - clockMinutes(t)) <
              data.settings.consultMinutes,
        ),
    );
    if (free) [date, time] = [day, free];
  }
  if (date)
    data.bookings.push({
      id: "company-booking-1",
      memberId: "",
      date,
      time,
      topic: "Leadership coaching for our new team leads",
      status: "confirmed",
      zoom: demoMeeting("company-booking-1"),
      source: "company",
      company: "Northwind Studio",
      contact: "Dana Ortiz",
      email: "dana@northwind.example",
      phone: "+1 512 555 0148",
      linkId: "company-link-2",
      createdAt: new Date().toISOString(),
    });
  data.companyLinks = [
    {
      id: "company-link-1",
      token: "wc7Kp2mQx9Rt4Ln8Vb3Zd6HsYa",
      label: "Willow & Co",
      createdAt: addDays(today(), -2),
      expiresAt: addDays(today(), 5),
    },
    {
      id: "company-link-2",
      token: "us9Xb3Td6Hs2Mn7Qw4Zk8Lp5Rc",
      label: "Northwind Studio",
      createdAt: addDays(today(), -3),
      expiresAt: addDays(today(), 4),
      bookingId: date ? "company-booking-1" : undefined,
    },
    {
      id: "company-link-3",
      token: "ex4Mn8Qw2Zt7Kp5Lb9Rd3HsVc",
      label: "Harbor Bakery",
      createdAt: addDays(today(), -12),
      expiresAt: addDays(today(), -5),
    },
  ];
  data.notices = date
    ? [
        {
          id: "notice-1",
          kind: "company-booking",
          bookingId: "company-booking-1",
          createdAt: new Date().toISOString(),
          seen: false,
        },
      ]
    : [];
}
export const getStore = () => getDemoState().data;
export const demoEnabled = () =>
  process.env.NODE_ENV === "development" && process.env.DEMO_MODE !== "false";
export const eventList = () => getStore().events ?? [];
export const demoMeeting = (id: string) => `https://example.invalid/zoom/${id}`;
export const upcomingSessions = () =>
  getStore()
    .sessions.filter((s) => s.date >= today())
    .toSorted((a, b) => a.date.localeCompare(b.date));
