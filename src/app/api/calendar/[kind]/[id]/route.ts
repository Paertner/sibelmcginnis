import { getUser } from "@/lib/auth";
import { isPremium } from "@/lib/access";
import { getStore } from "@/lib/store";
import { createIcs } from "@/lib/calendar";
import { bookingEvent, eventCalendarEvent, sessionEvent } from "@/lib/events";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  const headers = { "Cache-Control": "private, no-store" };
  const file = (event: Parameters<typeof createIcs>[0], name: string) =>
    new Response(createIcs(event), {
      headers: {
        ...headers,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  // Events are public, so anyone can add a published one to their calendar.
  if (kind === "event") {
    const event = getStore().events?.find(
      (e) => e.id === id && e.status === "published",
    );
    return event
      ? file(eventCalendarEvent(event), "morning-coffee-event.ics")
      : new Response("Event not found", { status: 404, headers });
  }
  // A company that just booked has no account; its booking id is not guessable.
  const companyBooking =
    kind === "booking"
      ? getStore().bookings.find(
          (b) =>
            b.id === id && b.status === "confirmed" && b.source === "company",
        )
      : undefined;
  if (companyBooking)
    return file(bookingEvent(companyBooking), "morning-coffee.ics");
  const user = await getUser();
  if (!user || !isPremium(user.role))
    return new Response("Premium membership required", {
      status: 403,
      headers,
    });
  const session =
    kind === "session"
      ? getStore().sessions.find((s) => s.id === id && !!s.zoom)
      : undefined;
  const booking =
    kind === "booking"
      ? getStore().bookings.find(
          (b) =>
            b.id === id &&
            b.status === "confirmed" &&
            (b.memberId === user.id || user.role === "admin"),
        )
      : undefined;
  if (!session && !booking)
    return new Response("Event not found", { status: 404, headers });
  return file(
    session ? sessionEvent(session) : bookingEvent(booking!),
    "morning-coffee.ics",
  );
}
