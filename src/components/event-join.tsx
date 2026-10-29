import Link from "next/link";
import { ActionForm } from "./action-form";
import { joinEvent, leaveEvent } from "@/lib/actions";
import { siteText } from "@/lib/site-copy";
import { isPast, seatsLeft } from "@/lib/event-posts";
import type { EventItem } from "@/lib/store";
import type { Role } from "@/lib/access";

/** Seats-left line with a small bar. */
export function SeatMeter({ event }: { event: EventItem }) {
  const left = seatsLeft(event),
    taken = event.attendees.length;
  return (
    <div className={`seat-meter${left ? "" : " full"}`}>
      <div className="seat-meter-bar" aria-hidden="true">
        <span
          style={{ width: `${Math.min(100, (taken / event.seats) * 100)}%` }}
        />
      </div>
      <b>
        {left
          ? `${left} of ${event.seats} ${siteText("events.seats-left")}`
          : siteText("events.no-seats")}
      </b>
    </div>
  );
}

/** One Join button; members who joined can Leave. Visitors go to sign in and come back. */
export function JoinPanel({
  event,
  role,
  userId,
}: {
  event: EventItem;
  role: Role;
  userId?: string;
}) {
  const joined = !!userId && event.attendees.includes(userId),
    full = seatsLeft(event) === 0;
  if (isPast(event))
    return <p className="muted">{siteText("events.past-notice")}</p>;
  if (role === "visitor")
    return (
      <div className="event-join">
        <Link
          className={`btn${full ? " disabled" : ""}`}
          href={`/login?next=/event/${event.id}`}
        >
          {full ? siteText("events.no-seats") : siteText("events.join")}
        </Link>
        <p className="muted event-join-note">
          {siteText("events.sign-in-to-join")}{" "}
          <Link href={`/join?plan=free&next=/event/${event.id}`}>
            {siteText("events.register")}
          </Link>
        </p>
      </div>
    );
  if (role === "admin")
    return (
      <p className="muted event-join-note">{siteText("events.admin-note")}</p>
    );
  if (joined)
    return (
      <div className="event-join">
        <p className="event-going">✓ {siteText("events.joined")}</p>
        <ActionForm
          action={leaveEvent}
          submitLabel={siteText("events.leave")}
          confirmMessage="Leave this event? Your seat becomes free for someone else."
        >
          <input type="hidden" name="id" value={event.id} />
        </ActionForm>
      </div>
    );
  return (
    <div className="event-join">
      <ActionForm
        action={joinEvent}
        submitLabel={
          full ? siteText("events.no-seats") : siteText("events.join")
        }
        submitDisabled={full}
      >
        <input type="hidden" name="id" value={event.id} />
      </ActionForm>
    </div>
  );
}
