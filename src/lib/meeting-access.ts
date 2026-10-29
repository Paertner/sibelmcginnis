import "server-only";
import { getStore } from "./store";
import type { User } from "./access";
import { isPremium } from "./access";
export function meetingAccess(user: User | null, kind: string, id: string) {
  if (!user) return { status: 401 as const };
  if (!isPremium(user.role)) return { status: 403 as const };
  const data = getStore();
  if (kind === "session") {
    const session = data.sessions.find((s) => s.id === id);
    return session
      ? {
          status: 200 as const,
          title: session.topic,
          zoomId: session.zoomId,
          date: session.date,
          time: data.settings.meetingTime,
          minutes: data.settings.meetingMinutes,
        }
      : { status: 404 as const };
  }
  if (kind === "booking") {
    const booking = data.bookings.find(
      (b) =>
        b.id === id &&
        b.status === "confirmed" &&
        (user.role === "admin" || b.memberId === user.id),
    );
    return booking
      ? {
          status: 200 as const,
          title: "Your consultation with Sibel",
          zoomId: booking.zoomId,
          date: booking.date,
          time: booking.time,
          minutes: data.settings.consultMinutes,
        }
      : { status: 404 as const };
  }
  return { status: 404 as const };
}
