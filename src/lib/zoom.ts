import "server-only";
import { getSecret } from "./secrets";
import { getStore } from "./store";

/**
 * Zoom (Server-to-Server OAuth). Sessions and member consultations require registration:
 * each Premium member gets a personal join link only after the site has checked their
 * membership, and the link can be revoked when the membership ends.
 */
const env = (k: string) => process.env[k] ?? "";
/** Saved in Settings (secret encrypted); the server environment is the fallback. */
function credentials() {
  const saved = getStore().integrations?.zoom;
  return {
    accountId: saved?.accountId || env("ZOOM_ACCOUNT_ID"),
    clientId: saved?.clientId || env("ZOOM_CLIENT_ID"),
    clientSecret: getSecret("zoomClientSecret"),
  };
}
export const zoomConfigured = () => {
  const c = credentials();
  return !!c.accountId && !!c.clientId && !!c.clientSecret;
};
const timezone = () => env("ZOOM_TIMEZONE") || "America/New_York";

const globals = globalThis as typeof globalThis & {
  mccZoomToken?: { value: string; expires: number };
};

/** Checks a set of credentials without saving them. */
export async function testZoomCredentials(c: {
  accountId: string;
  clientId: string;
  clientSecret: string;
}) {
  const basic = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString(
    "base64",
  );
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(c.accountId)}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  );
  return response.ok;
}
/** Forget the cached sign-in, e.g. after the credentials were changed. */
export function resetZoomToken() {
  globals.mccZoomToken = undefined;
}

async function token() {
  const cached = globals.mccZoomToken;
  if (cached && cached.expires > Date.now() + 60_000) return cached.value;
  const c = credentials();
  const basic = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString(
    "base64",
  );
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(c.accountId)}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  );
  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!response.ok || !data.access_token)
    throw new Error("Zoom sign-in failed. Check the Zoom connection.");
  globals.mccZoomToken = {
    value: data.access_token,
    expires: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

async function zoom<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.zoom.us/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Content-Type": "application/json",
    },
  });
  if (response.status === 204) return undefined as T;
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  if (!response.ok)
    throw new Error(
      `Zoom: ${data.message ?? `request failed (${response.status})`}`,
    );
  return data as T;
}

export type Meeting = { id: string; joinUrl: string; password: string };
type MeetingInput = {
  topic: string;
  /** YYYY-MM-DD and HH:MM, in the Zoom time zone */
  date: string;
  time: string;
  minutes: number;
  /** Members register and get a personal link; otherwise anyone with the link can join. */
  registration: boolean;
};
const body = (m: MeetingInput) => ({
  topic: m.topic.slice(0, 200),
  type: 2,
  start_time: `${m.date}T${m.time.slice(0, 5)}:00`,
  timezone: timezone(),
  duration: m.minutes,
  settings: {
    approval_type: m.registration ? 0 : 2,
    registration_type: 1,
    join_before_host: false,
    waiting_room: true,
    mute_upon_entry: true,
    registrants_email_notification: false,
    registrants_confirmation_email: false,
    meeting_authentication: false,
  },
});

export async function createMeeting(input: MeetingInput): Promise<Meeting> {
  const meeting = await zoom<{
    id: number;
    join_url: string;
    password?: string;
    registration_url?: string;
  }>("/users/me/meetings", {
    method: "POST",
    body: JSON.stringify(body(input)),
  });
  return {
    id: String(meeting.id),
    joinUrl: meeting.join_url,
    password: meeting.password ?? "",
  };
}

export async function updateMeeting(id: string, input: MeetingInput) {
  await zoom(`/meetings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body(input)),
  });
}

export async function deleteMeeting(id: string) {
  try {
    await zoom(`/meetings/${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch (error) {
    // Already gone is fine.
    if (!/not found|does not exist/i.test(String(error))) throw error;
  }
}

/** Registers one person and returns their personal join link. */
export async function registerAttendee(
  meetingId: string,
  person: { email: string; name: string },
) {
  const [first, ...rest] = person.name.trim().split(/\s+/);
  const result = await zoom<{ registrant_id: string; join_url: string }>(
    `/meetings/${encodeURIComponent(meetingId)}/registrants`,
    {
      method: "POST",
      body: JSON.stringify({
        email: person.email,
        first_name: first || person.email,
        last_name: rest.join(" ") || "-",
      }),
    },
  );
  return result.join_url;
}

/** Cancels this person's registration, so their personal link stops working. */
export async function revokeAttendee(meetingId: string, email: string) {
  const list = await zoom<{
    registrants?: { id: string; email: string }[];
  }>(
    `/meetings/${encodeURIComponent(meetingId)}/registrants?status=approved&page_size=300`,
  );
  const found = (list.registrants ?? []).filter(
    (r) => r.email.toLowerCase() === email.toLowerCase(),
  );
  if (!found.length) return;
  await zoom(`/meetings/${encodeURIComponent(meetingId)}/registrants/status`, {
    method: "PUT",
    body: JSON.stringify({
      action: "cancel",
      registrants: found.map(({ id, email }) => ({ id, email })),
    }),
  });
}
