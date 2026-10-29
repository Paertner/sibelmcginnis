import Link from "next/link";
import { siteText } from "@/lib/site-copy";
import { getStore } from "@/lib/store";
import { fmtDate } from "@/lib/dates";
import { bookingEvent } from "@/lib/events";
import { companyDays, findLink, linkStatus } from "@/lib/company-links";
import { BookingForm } from "@/components/consultation-calendar";
import { CalendarButtons } from "@/components/calendar-buttons";
export const metadata = { title: "Company booking" };

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <section className="block">
      <div className="wrap">
        <div className="card company-notice" role="status">
          <h2>{title}</h2>
          <p>{text}</p>
          <Link className="btn btn-sm" href="/contact">
            {siteText("company.contact-us")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function CompanyBooking({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ booked?: string }>;
}) {
  const { token } = await params,
    { booked } = await searchParams;
  const link = findLink(token),
    data = getStore();
  const booking = link?.bookingId
    ? data.bookings.find((b) => b.id === link.bookingId)
    : undefined;
  const status = link ? linkStatus(link) : undefined;
  const hero = (
    <div className="page-hero">
      <div className="wrap">
        <p className="eyebrow">{siteText("company.eyebrow")}</p>
        <h1>{siteText("company.title")}</h1>
        {status === "active" ? <p>{siteText("company.intro")}</p> : null}
      </div>
    </div>
  );
  // Right after booking, the same visitor sees the confirmation.
  if (link && booking && booked === booking.id)
    return (
      <>
        <div className="page-hero">
          <div className="wrap">
            <p className="eyebrow">{siteText("company.eyebrow")}</p>
            <h1>{siteText("company.confirmed-title")}</h1>
            <p>{siteText("company.confirmed-text")}</p>
          </div>
        </div>
        <section className="block">
          <div className="wrap">
            <div className="card company-confirmed">
              <dl>
                <dt>When</dt>
                <dd>
                  <b>
                    {fmtDate(booking.date, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </b>
                  <br />
                  {booking.time} · {data.settings.consultMinutes} minutes
                </dd>
                <dt>Company</dt>
                <dd>{booking.company}</dd>
                <dt>Contact</dt>
                <dd>
                  {booking.contact}
                  <br />
                  {booking.email} · {booking.phone}
                </dd>
                <dt>Topic</dt>
                <dd>{booking.topic}</dd>
                <dt>{siteText("company.meeting-link")}</dt>
                <dd>
                  <a href={booking.zoom}>{booking.zoom}</a>
                  <br />
                  <small className="muted">
                    {siteText("company.meeting-note")}
                  </small>
                </dd>
              </dl>
              <CalendarButtons event={bookingEvent(booking)} kind="booking" />
            </div>
          </div>
        </section>
      </>
    );
  if (!link || !status)
    return (
      <>
        {hero}
        <Notice
          title={siteText("company.unknown-title")}
          text={siteText("company.unknown-text")}
        />
      </>
    );
  if (status !== "active")
    return (
      <>
        {hero}
        <Notice
          title={siteText(`company.${status}-title`)}
          text={siteText(`company.${status}-text`)}
        />
      </>
    );
  return (
    <>
      {hero}
      <section className="block">
        <div className="wrap">
          <BookingForm
            days={companyDays()}
            minutes={data.settings.consultMinutes}
            company={{ token }}
          />
        </div>
      </section>
    </>
  );
}
