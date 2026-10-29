import Image from "next/image";
import Link from "next/link";
import { eventImageProps } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import { fmtDate } from "@/lib/dates";
import { isPaid, isPast, timeRange } from "@/lib/event-posts";
import type { EventItem } from "@/lib/store";
import { Icon } from "./admin-icons";
import { SeatMeter } from "./event-join";

export function DateBlock({ date }: { date: string }) {
  return (
    <span className="event-date" aria-hidden="true">
      <small>{fmtDate(date, { month: "short" })}</small>
      <b>{fmtDate(date, { day: "numeric" })}</b>
      <small>{fmtDate(date, { weekday: "short" })}</small>
    </span>
  );
}
export function EventCards({ events }: { events: EventItem[] }) {
  return events.map((e) => (
    <Link
      className={`card event-card${isPast(e) ? " is-past" : ""}`}
      href={`/event/${e.id}`}
      key={e.id}
    >
      <div className="post-cover">
        <Image
          {...eventImageProps(e.id)}
          alt={eventImageProps(e.id).alt}
          fill
          sizes="(max-width: 860px) 90vw, 380px"
        />
        <DateBlock date={e.date} />
        <span className={`badge ${isPaid(e) ? "b-premium" : "b-public"}`}>
          {isPaid(e) ? e.price : siteText("events.free")}
        </span>
      </div>
      <div className="post-body">
        <div className="post-meta">
          {fmtDate(e.date, { weekday: "long", month: "long", day: "numeric" })}{" "}
          · {timeRange(e)}
        </div>
        <h3>{e.title}</h3>
        <p className="event-venue">
          <Icon name="pin" size={16} />
          {e.venue}
        </p>
        {isPast(e) ? (
          <span className="lock">{siteText("events.past-label")}</span>
        ) : (
          <SeatMeter event={e} />
        )}
      </div>
    </Link>
  ));
}
