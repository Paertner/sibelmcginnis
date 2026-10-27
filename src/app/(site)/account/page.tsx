import { siteText } from "@/lib/site-copy";
import { PodcastLibrary } from "@/components/podcast-library";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getStore, upcomingSessions } from "@/lib/store";
import { canView, isPremium } from "@/lib/access";
import { addDays, fmtDate, today } from "@/lib/dates";
import { bookingEvent, sessionEvent } from "@/lib/events";
import { Badge } from "@/components/post-cards";
import { CalendarButtons } from "@/components/calendar-buttons";
import { AnnouncementContent } from "@/components/announcement-content";
import { announcementVisible } from "@/lib/announcements";
import { meetingUrl } from "@/lib/site-url";
import { CopyLink } from "@/components/copy-link";
import { BookingForm } from "@/components/consultation-calendar";
import { ActionForm } from "@/components/action-form";
import { cancelBooking, changeTier, signOut } from "@/lib/actions";
export const metadata = { title: "My account" };
const tabs = [
  ["overview", "Overview"],
  ["library", "Blog library"],
  ["sessions", "Session notes"],
  ["book", "Book a consultation"],
  ["membership", "Membership"],
  ["podcast", "Podcast"],
];
function PremiumGate({ title }: { title: string }) {
  return (
    <div className="card center">
      <h3>{title}</h3>
      <p>
        {siteText(
          "account.included-with-premium-saturday-circles-session-notes-podcast-audi",
        )}
      </p>
      <Link className="btn" href="/account?tab=membership">
        {siteText("account.see-premium")}
      </Link>
    </div>
  );
}
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireMember(),
    data = getStore(),
    premium = isPremium(user.role);
  const tab = (await searchParams).tab ?? "overview";
  const bookings = data.bookings
    .filter((b) => b.memberId === user.id)
    .toSorted((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const sessions = upcomingSessions(),
    next = sessions[0];
  const used = bookings.filter(
    (b) =>
      b.status !== "cancelled" && b.date.slice(0, 7) === today().slice(0, 7),
  ).length;
  const posts = data.posts
    .filter((p) => p.status === "published")
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const upcomingBookings = bookings.filter(
    (b) => b.status !== "cancelled" && b.date >= today(),
  );
  const content = (() => {
    if (tab === "podcast")
      return (
        <>
          <h1 className="area-title">{siteText("account.podcast")}</h1>
          {premium ? (
            <>
              <p className="muted">
                {siteText(
                  "account.catch-up-on-saturday-conversations-and-bonus-episodes-right-here-",
                )}
              </p>
              <PodcastLibrary allowed />
            </>
          ) : (
            <PremiumGate
              title={siteText("account.podcast-audio-is-a-premium-feature")}
            />
          )}
        </>
      );

    if (tab === "library")
      return (
        <>
          <h1 className="area-title">{siteText("account.blog-library")}</h1>
          <div className="card member-library">
            {posts.map((p) => (
              <div className="list-item" key={p.id}>
                <div>
                  <Link href={`/post/${p.id}`}>
                    <b>{p.title}</b>
                  </Link>
                  <br />
                  <small className="muted">
                    {fmtDate(p.date, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {p.category}
                  </small>
                </div>
                {canView(p.access, user.role) ? (
                  <Badge access={p.access} />
                ) : (
                  <span className="badge b-grey">
                    {siteText("account.premium")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      );
    if (tab === "sessions")
      return (
        <>
          <h1 className="area-title">
            {siteText("account.session-notes-amp-podcast")}
          </h1>
          {premium ? (
            <>
              <div className="card">
                {data.sessions
                  .filter((s) => s.date < today())
                  .toSorted((a, b) => b.date.localeCompare(a.date))
                  .map((s) => (
                    <div className="list-item" key={s.id}>
                      <div>
                        <b>{s.topic}</b>
                        <br />
                        <small className="muted">{fmtDate(s.date)}</small>
                        <p className="preserve-lines member-notes">
                          {s.notes || siteText("account.notes-coming")}
                        </p>
                      </div>
                      {data.podcasts.some(
                        (p) => p.id === s.podcast && p.status === "published",
                      ) ? (
                        <Link
                          className="btn btn-sm btn-ghost"
                          href={`/account?tab=podcast#${s.podcast}`}
                        >
                          {siteText("account.listen")}
                        </Link>
                      ) : null}
                    </div>
                  ))}
              </div>
              <p className="section-top">
                <Link className="btn" href="/account?tab=podcast">
                  {siteText("account.open-the-full-podcast")}
                </Link>
              </p>
            </>
          ) : (
            <PremiumGate
              title={siteText("account.session-notes-are-a-premium-feature")}
            />
          )}
        </>
      );
    if (tab === "book") {
      const days = Array.from({ length: 21 }, (_, i) => addDays(today(), i + 1))
        .map((date) => {
          const day = new Date(date + "T12:00:00Z").getUTCDay();
          const times =
            (data.availability as Record<string, string[]>)[day] ?? [];
          const mins = (t: string) =>
            Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
          const available = times.filter(
            (t) =>
              !data.bookings.some(
                (b) =>
                  b.status !== "cancelled" &&
                  b.date === date &&
                  Math.abs(mins(b.time) - mins(t)) <
                    data.settings.consultMinutes,
              ),
          );
          const usedInMonth = bookings.filter(
            (b) =>
              b.status !== "cancelled" &&
              b.date.slice(0, 7) === date.slice(0, 7),
          ).length;
          return {
            date,
            label: fmtDate(date),
            times:
              usedInMonth < data.settings.consultsPerMonth ? available : [],
          };
        })
        .filter((d) => d.times.length);
      return (
        <>
          <h1 className="area-title">
            {siteText("account.book-a-consultation")}
          </h1>
          {premium ? (
            <>
              <div className="card section-gap consultation-container">
                <p>
                  {siteText("account.included-with-your-membership")}{" "}
                  <b>
                    {Math.max(0, data.settings.consultsPerMonth - used)}{" "}
                    {siteText("account.of")} {data.settings.consultsPerMonth}
                  </b>{" "}
                  {siteText("account.remaining-this-month")}{" "}
                  {data.settings.consultMinutes}{" "}
                  {siteText("account.minutes-on-zoom")}
                </p>
                <BookingForm
                  days={days}
                  minutes={data.settings.consultMinutes}
                />
              </div>
              <h3 className="member-consultations-title">
                {siteText("account.my-consultations")}
              </h3>
              <div className="card">
                {bookings.length ? (
                  bookings.map((b) => (
                    <div className="list-item" key={b.id}>
                      <div>
                        <b>
                          {fmtDate(b.date)} · {b.time}
                        </b>
                        <p>{b.topic}</p>
                        <span
                          className={`badge b-${b.status === "confirmed" ? "ok" : b.status === "pending" ? "warn" : "bad"}`}
                        >
                          {b.status}
                        </span>
                        {b.status === "confirmed" ? (
                          <>
                            <p>
                              <Link href={meetingUrl("booking", b.id)}>
                                {siteText("account.open-consultation")}
                              </Link>
                            </p>
                            <CalendarButtons
                              event={bookingEvent(b)}
                              kind="booking"
                            />
                          </>
                        ) : null}
                      </div>
                      {b.status !== "cancelled" && b.date >= today() ? (
                        <ActionForm
                          action={cancelBooking}
                          submitLabel={siteText("account.cancel-booking")}
                        >
                          <input type="hidden" name="id" value={b.id} />
                        </ActionForm>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p>{siteText("account.nothing-booked-yet")}</p>
                )}
              </div>
            </>
          ) : (
            <PremiumGate
              title={siteText(
                "account.one-on-one-consultations-are-a-premium-perk",
              )}
            />
          )}
        </>
      );
    }
    if (tab === "membership")
      return (
        <>
          <h1 className="area-title">{siteText("account.membership")}</h1>
          <div className="card">
            <div className="list-item">
              <div>
                <b>{user.name}</b>
                <br />
                <small className="muted">
                  {user.email}
                  {data.members.find((m) => m.id === user.id)?.joined
                    ? ` · member since ${fmtDate(data.members.find((m) => m.id === user.id)!.joined, { month: "long", year: "numeric" })}`
                    : ""}
                </small>
              </div>
              <span className={`badge b-${premium ? "premium" : "free"}`}>
                {premium
                  ? siteText("account.premium-2")
                  : siteText("account.free")}
              </span>
            </div>
            <p className="section-top">
              {premium
                ? `$${data.settings.premiumPrice} / month`
                : siteText("account.free-membership")}
            </p>
            <p className="muted">
              {siteText(
                "account.billing-will-be-managed-securely-through-stripe-once-checkout-is-",
              )}
            </p>
            {user.role !== "admin" ? (
              <ActionForm
                action={changeTier}
                submitLabel={
                  premium
                    ? siteText("account.review-downgrade")
                    : "Review Premium membership"
                }
              >
                <input
                  type="hidden"
                  name="tier"
                  value={premium ? "free" : "premium"}
                />
              </ActionForm>
            ) : null}
          </div>
        </>
      );
    return (
      <>
        <h1 className="area-title">
          {siteText("account.hello")} {user.name.split(" ")[0]} ☕
        </h1>
        {next ? (
          <div className={`zoomcard ${premium ? "" : "locked"}`}>
            <p className="eyebrow">
              {siteText("account.your-next-saturday-circle")}
            </p>
            <h2>
              {fmtDate(next.date)} · {data.settings.meetingTime}
            </h2>
            <p>
              {siteText("account.topic")} <b>{next.topic}</b>
            </p>
            {premium ? (
              next.zoom ? (
                <>
                  <p className="meeting-link">
                    {siteText(
                      "account.this-week-s-meeting-protected-session-access",
                    )}
                  </p>
                  <p className="muted-on-dark">
                    {siteText(
                      "account.your-premium-membership-is-checked-when-you-open-the-session-even",
                    )}
                  </p>
                  <div className="hero-btns section-gap">
                    <Link className="btn" href={meetingUrl("session", next.id)}>
                      {siteText("account.open-session")}
                    </Link>
                    <CopyLink value={meetingUrl("session", next.id)} />
                  </div>
                  <CalendarButtons event={sessionEvent(next)} kind="session" />
                </>
              ) : (
                <p>
                  {siteText("account.your-meeting-link-will-be-added-soon")}
                </p>
              )
            ) : (
              <>
                <p>
                  {siteText(
                    "account.the-zoom-link-is-available-to-premium-members",
                  )}
                </p>
                <Link className="btn" href="/account?tab=membership">
                  {siteText("account.unlock-my-zoom-link")}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="card">
            <h3>{siteText("account.no-saturday-session-scheduled-yet")}</h3>
            <p>{siteText("account.check-back-soon-for-your-next-circle")}</p>
          </div>
        )}
        {premium && sessions.length > 1 ? (
          <div className="card section-top">
            <h3>{siteText("account.upcoming-saturdays")}</h3>
            {sessions.slice(1, 4).map((s) => (
              <div className="list-item" key={s.id}>
                <div>
                  <b>{fmtDate(s.date)}</b>
                  <br />
                  <small className="muted">
                    {s.topic} ·{" "}
                    <Link href={meetingUrl("session", s.id)}>
                      {siteText("account.open-session")}
                    </Link>
                    <br />
                    {siteText("account.access-is-checked-when-you-join")}
                  </small>
                </div>
                {s.zoom ? (
                  <CalendarButtons event={sessionEvent(s)} kind="session" />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        <div className="grid g2 section-top">
          <div className="card">
            <h3>{siteText("account.1-1-consultation")}</h3>
            {premium ? (
              <>
                {upcomingBookings.length ? (
                  upcomingBookings.map((b) => (
                    <div key={b.id}>
                      <b>
                        {fmtDate(b.date)} {siteText("account.at")} {b.time}
                      </b>
                      <p>
                        {b.topic} · {b.status}
                      </p>
                      {b.status === "confirmed" ? (
                        <CalendarButtons
                          event={bookingEvent(b)}
                          kind="booking"
                        />
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p>
                    {siteText("account.no-consultation-booked-yet-you-have")}{" "}
                    {Math.max(0, data.settings.consultsPerMonth - used)}{" "}
                    {siteText("account.left-this-month")}
                  </p>
                )}
                <Link className="btn btn-sm" href="/account?tab=book">
                  {siteText("account.book-a-time")}
                </Link>
              </>
            ) : (
              <>
                <p className="muted">
                  {siteText(
                    "account.one-on-one-time-with-sibel-is-a-premium-perk",
                  )}
                </p>
                <Link className="btn btn-sm" href="/account?tab=membership">
                  {siteText("account.see-premium")}
                </Link>
              </>
            )}
          </div>
          <div className="card">
            <h3>{siteText("account.latest-for-you")}</h3>
            {posts
              .filter((p) => canView(p.access, user.role))
              .slice(0, 3)
              .map((p) => (
                <p key={p.id}>
                  <Link href={`/post/${p.id}`}>{p.title}</Link>
                </p>
              ))}
            <Link className="btn btn-sm btn-ghost" href="/account?tab=library">
              {siteText("account.open-library")}
            </Link>
          </div>
        </div>
        {data.announcements
          .filter((a) => announcementVisible(a, user.id, user.role))
          .map((a) => (
            <div className="card section-top" key={a.id}>
              <h3>{a.subject}</h3>
              <AnnouncementContent announcement={a} name={user.name} />
            </div>
          ))}
      </>
    );
  })();
  return (
    <div className="wrap">
      <div className="acct">
        <aside className="side">
          <div className="member-summary">
            <span className="avatar">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <b>{user.name}</b>
              <br />
              <Badge access={user.role} />
            </div>
          </div>
          <nav aria-label="Member area">
            {tabs.map(([key, label]) => (
              <Link
                className={key === tab ? "on" : ""}
                aria-current={key === tab ? "page" : undefined}
                key={key}
                href={`/account?tab=${key}`}
              >
                {siteText(`account.tab-${key}`) || label}
                {key === "podcast" && !premium ? " 🔒" : ""}
              </Link>
            ))}
            {user.role === "admin" ? (
              <Link href="/admin">{siteText("account.admin-panel")}</Link>
            ) : null}
          </nav>
          <form action={signOut}>
            <button className="side-signout">
              {siteText("account.sign-out")}
            </button>
          </form>
        </aside>
        <div className="account-content">{content}</div>
      </div>
    </div>
  );
}
