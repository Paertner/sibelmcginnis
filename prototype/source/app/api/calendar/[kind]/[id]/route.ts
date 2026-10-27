import { getUser } from "@/lib/auth";
import { isPremium } from "@/lib/access";
import { getStore } from "@/lib/store";
import { createIcs } from "@/lib/calendar";
import { sessionEvent, bookingEvent } from "@/lib/events";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const user = await getUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || !isPremium(user.role))
    return new Response("Premium membership required", {
      status: 403,
      headers,
    });
  const { kind, id } = await params;
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
  const event = session ? sessionEvent(session) : bookingEvent(booking!);
  return new Response(createIcs(event), {
    headers: {
      ...headers,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="morning-coffee.ics"',
    },
  });
}
