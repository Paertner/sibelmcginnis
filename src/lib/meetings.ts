import "server-only";
import { demoMeeting, getStore, usesDatabase } from "./store";
import {
  createMeeting,
  deleteMeeting,
  revokeAttendee,
  updateMeeting,
  zoomConfigured,
} from "./zoom";
import { today } from "./dates";

/** Real Zoom meetings are used with the live database; local review keeps sample links. */
export const liveZoom = () => usesDatabase() && zoomConfigured();

export type Provisioned = { zoom: string; zoomId?: string; pass: string };

/** Creates the meeting for a session or consultation, or a sample link in local review. */
export async function provision(input: {
  id: string;
  topic: string;
  date: string;
  time: string;
  minutes: number;
  /** Members register for a personal link; companies join with the plain link. */
  registration: boolean;
}): Promise<Provisioned> {
  if (!liveZoom()) return { zoom: demoMeeting(input.id), pass: "" };
  const meeting = await createMeeting(input);
  return { zoom: meeting.joinUrl, zoomId: meeting.id, pass: meeting.password };
}

/** Removes a meeting from Zoom. A failure is logged, never blocks the admin. */
export async function dropMeeting(zoomId?: string) {
  if (!zoomId || !liveZoom()) return;
  try {
    await deleteMeeting(zoomId);
  } catch (error) {
    console.error("[zoom] could not delete meeting", zoomId, error);
  }
}

/** Keeps a meeting's time in step when a session is moved. */
export async function moveMeeting(
  zoomId: string | undefined,
  input: Parameters<typeof provision>[0],
) {
  if (!zoomId || !liveZoom()) return;
  await updateMeeting(zoomId, input);
}

/** Cancels a person's registration on every upcoming meeting, so saved links stop working. */
export async function revokeFromUpcoming(email: string) {
  if (!liveZoom() || !email) return;
  const data = getStore();
  const ids = [
    ...data.sessions.filter((s) => s.date >= today()).map((s) => s.zoomId),
    ...data.bookings
      .filter((b) => b.date >= today() && b.status === "confirmed")
      .map((b) => b.zoomId),
  ].filter((id): id is string => !!id);
  for (const id of ids) {
    try {
      await revokeAttendee(id, email);
    } catch (error) {
      console.error("[zoom] could not revoke", id, error);
    }
  }
}
