import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteText } from "@/lib/site-copy";
import { getStore } from "@/lib/store";
import { getUser } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";
import { eventImageProps } from "@/lib/site-images";
import { isPaid, isPast, timeRange } from "@/lib/event-posts";
import { BlockContent } from "@/components/block-content";
import { Icon } from "@/components/admin-icons";
import { JoinPanel, SeatMeter } from "@/components/event-join";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = (getStore().events ?? []).find(
    (e) => e.id === id && e.status === "published",
  );
  return { title: event?.title ?? "Event not found" };
}
export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = (getStore().events ?? []).find(
    (e) => e.id === id && e.status === "published",
  );
  if (!event) notFound();
  const user = await getUser();
  return (
    <article className="block">
      <div className="wrap">
        <Link className="muted" href="/events">
          ← {siteText("events.back")}
        </Link>
        <h1 className="event-title">{event.title}</h1>
        <div className="event-layout">
          <div>
            <Image
              {...eventImageProps(event.id)}
              alt={eventImageProps(event.id).alt}
              className="article-cover"
              width={900}
              height={400}
              sizes="(max-width: 780px) 90vw, 730px"
            />
            <BlockContent blocks={event.blocks} />
          </div>
          <aside
            className="card event-side"
            aria-label={siteText("events.details")}
          >
            <h2>{siteText("events.details")}</h2>
            <ul className="event-facts">
              <li>
                <Icon name="calendar" size={18} />
                <span>
                  <b>
                    {fmtDate(event.date, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </b>
                  {timeRange(event)}
                </span>
              </li>
              <li>
                <Icon name="pin" size={18} />
                <span>
                  <b>{event.venue}</b>
                  {event.address}
                  {event.mapUrl ? (
                    <>
                      <br />
                      <a href={event.mapUrl} target="_blank" rel="noreferrer">
                        {siteText("events.map")} ↗
                      </a>
                    </>
                  ) : null}
                </span>
              </li>
              <li>
                <Icon name="ticket" size={18} />
                <span>
                  <b>{isPaid(event) ? event.price : siteText("events.free")}</b>
                  {isPaid(event) ? siteText("events.payment-later") : null}
                </span>
              </li>
            </ul>
            {isPast(event) ? null : <SeatMeter event={event} />}
            <JoinPanel
              event={event}
              role={user?.role ?? "visitor"}
              userId={user?.id}
            />
          </aside>
        </div>
      </div>
    </article>
  );
}
