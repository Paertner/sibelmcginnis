import { siteText } from "@/lib/site-copy";
import { EventCards } from "@/components/event-cards";
import { pastEvents, upcomingEvents } from "@/lib/event-posts";
export const metadata = { title: "Events" };
export default async function Events() {
  const upcoming = upcomingEvents(),
    past = pastEvents();
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{siteText("events.eyebrow")}</p>
          <h1>{siteText("events.title")}</h1>
          <p>{siteText("events.sub")}</p>
        </div>
      </div>
      <section className="block">
        <div className="wrap">
          <h2 className="events-heading">{siteText("events.upcoming")}</h2>
          {upcoming.length ? (
            <div className="grid g3">
              <EventCards events={upcoming} />
            </div>
          ) : (
            <p className="muted">{siteText("events.none")}</p>
          )}
          {past.length ? (
            <>
              <h2 className="events-heading events-past-heading">
                {siteText("events.past")}
              </h2>
              <div className="grid g3">
                <EventCards events={past} />
              </div>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
