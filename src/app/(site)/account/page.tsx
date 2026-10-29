import { siteText } from "@/lib/site-copy";
import { PodcastLibrary } from "@/components/podcast-library";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getDemoState, getStore, upcomingSessions } from "@/lib/store";
import { canView, isPremium } from "@/lib/access";
import { addDays, daysLeftLabel, fmtDate, today } from "@/lib/dates";
import { bookingEvent, eventCalendarEvent, sessionEvent } from "@/lib/events";
import { Badge, PostCards } from "@/components/post-cards";
import Image from "next/image";
import { postImageProps } from "@/lib/site-images";
import { fmtTime, upcomingEvents } from "@/lib/event-posts";
import { CalendarButtons } from "@/components/calendar-buttons";
import { AnnouncementContent } from "@/components/announcement-content";
import { announcementVisible } from "@/lib/announcements";
import { meetingUrl } from "@/lib/site-url";
import { Icon, type IconName } from "@/components/admin-icons";
import { BookingForm } from "@/components/consultation-calendar";
import { PasswordFields } from "@/components/password-fields";
import { ActionForm } from "@/components/action-form";
import { EmailPreferencesForm } from "@/components/email-preferences-form";
import {
  cancelBooking,
  changePassword,
  changeTier,
  openBillingPortal,
  signOut,
  startCheckout,
} from "@/lib/actions";
import { usesDatabase } from "@/lib/store";
import { stripeConfigured } from "@/lib/stripe";
export const metadata = { title: "My account" };
const tabs: [string, string, IconName][] = [
  ["overview", "Overview", "home"],
  ["library", "Blog library", "book"],
  ["sessions", "Session notes", "notes"],
  ["book", "Book a consultation", "calendar"],
  ["podcast", "Podcast", "headphones"],
  ["membership", "Membership", "star"],
  ["emails", "Email preferences", "mail"],
  ["password", "Password", "lock"],
];
const premiumTabs = ["sessions", "book", "podcast"];
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
  searchParams: Promise<{
    tab?: string;
    unsubscribe?: string;
    checkout?: string;
  }>;
}) {
  const user = await requireMember(),
    data = getStore(),
    premium = isPremium(user.role);
  const query = await searchParams;
  const tab = query.tab ?? "overview";
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
  const messages = data.announcements.filter((a) =>
    announcementVisible(a, user.id, user.role),
  );
  const member = data.members.find((m) => m.id === user.id);
  const myEvents = upcomingEvents().filter((e) =>
    e.attendees.includes(user.id),
  );
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
          <div className="grid g3 member-library">
            <PostCards posts={posts} role={user.role} />
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
              <ul className="session-cards">
                {data.sessions
                  .filter((s) => s.date < today())
                  .toSorted((a, b) => b.date.localeCompare(a.date))
                  .map((s) => (
                    <li key={s.id}>
                      <Link className="session-card" href={`/session/${s.id}`}>
                        <span className="date-chip" aria-hidden="true">
                          <b>{fmtDate(s.date, { day: "numeric" })}</b>
                          {fmtDate(s.date, { month: "short" })}
                        </span>
                        <span className="session-card-text">
                          <b>{s.topic}</b>
                          <small>{fmtDate(s.date)}</small>
                          <span className="session-card-notes">
                            {s.notes || siteText("account.notes-coming")}
                          </span>
                        </span>
                        <span className="session-card-meta">
                          {data.podcasts.some(
                            (p) =>
                              p.id === s.podcast &&
                              p.status === "published" &&
                              getDemoState().audio.has(p.id),
                          ) ? (
                            <span className="session-audio-tag">
                              <Icon name="headphones" size={14} />
                              {siteText("account.listen")}
                            </span>
                          ) : null}
                          <span className="session-card-arrow">
                            {siteText("account.read-notes")} →
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
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
                          {b.status === "pending"
                            ? "awaiting approval"
                            : b.status}
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
    if (tab === "password")
      return (
        <>
          <h1 className="area-title">Change password</h1>
          <div className="card">
            <ActionForm action={changePassword} submitLabel="Change password">
              <div className="field">
                <label htmlFor="currentPassword">Current password</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              </div>
              <PasswordFields
                label="New password"
                repeatLabel="Repeat new password"
                hint="Use at least 8 characters."
              />
            </ActionForm>
          </div>
        </>
      );
    if (tab === "emails")
      return (
        <>
          <h1 className="area-title">Email preferences</h1>
          <div className="card">
            {member ? (
              <>
                <p className="muted">
                  Choose which emails you receive at <b>{member.email}</b>.
                  Messages from Sibel always stay in your account.
                </p>
                <EmailPreferencesForm
                  preferences={member.emailPreferences}
                  preselectUnsubscribe={query.unsubscribe === "1"}
                />
              </>
            ) : (
              <p className="muted">
                The admin account does not receive member emails, so there is
                nothing to set here.
              </p>
            )}
          </div>
        </>
      );
    if (tab === "membership")
      return (
        <>
          <h1 className="area-title">{siteText("account.membership")}</h1>
          {query.checkout === "success" ? (
            <p className="dash-notice" role="status">
              Thank you! Your payment went through. Premium access switches on
              within a minute; refresh this page if you do not see it yet.
            </p>
          ) : query.checkout === "cancelled" ? (
            <p className="dash-notice" role="status">
              Checkout was cancelled. You have not been charged.
            </p>
          ) : null}
          <div className="card">
            <div className="list-item">
              <div>
                <b>{user.name}</b>
                <br />
                <small className="muted">
                  {user.email}
                  {member?.joined
                    ? ` · member since ${fmtDate(member.joined, { month: "long", year: "numeric" })}`
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
            {premium && member?.premiumUntil ? (
              <p className="membership-until">
                <Icon name="calendar" size={16} />
                {siteText("account.premium-access-through")}{" "}
                <b>
                  {fmtDate(member.premiumUntil.slice(0, 10), {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </b>
              </p>
            ) : null}
            <p className="muted">
              {siteText(
                "account.billing-will-be-managed-securely-through-stripe-once-checkout-is-",
              )}
            </p>
            {user.role !== "admin" && usesDatabase() ? (
              stripeConfigured() ? (
                premium ? (
                  <ActionForm
                    action={openBillingPortal}
                    submitLabel="Manage billing"
                  >
                    <></>
                  </ActionForm>
                ) : (
                  <ActionForm
                    action={startCheckout}
                    submitLabel={`Subscribe · $${data.settings.premiumPrice} / month`}
                  >
                    <></>
                  </ActionForm>
                )
              ) : (
                <p className="muted">Premium checkout is not open yet.</p>
              )
            ) : user.role !== "admin" ? (
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
          <section
            className={`next-circle member-circle${premium ? "" : " locked"}`}
            aria-labelledby="member-circle-title"
          >
            <p className="next-circle-eyebrow">
              {siteText("account.your-next-saturday-circle")}
            </p>
            {daysLeftLabel(next.date) ? (
              <span className="days-left" role="status">
                {daysLeftLabel(next.date)}
              </span>
            ) : null}
            <div className="next-circle-row">
              <span className="date-block" aria-hidden="true">
                <small>{fmtDate(next.date, { weekday: "short" })}</small>
                <b>{fmtDate(next.date, { day: "numeric" })}</b>
                <small>{fmtDate(next.date, { month: "short" })}</small>
              </span>
              <div>
                <h2 id="member-circle-title">{next.topic}</h2>
                <p>
                  {fmtDate(next.date)} · {data.settings.meetingTime} ·{" "}
                  {data.settings.meetingMinutes} min
                </p>
              </div>
            </div>
            {premium ? (
              next.zoom ? (
                <>
                  <div className="next-circle-actions">
                    <Link className="btn" href={meetingUrl("session", next.id)}>
                      {siteText("account.open-session")}
                    </Link>
                    <CalendarButtons
                      event={sessionEvent(next)}
                      kind="session"
                    />
                  </div>
                  <p className="next-circle-note">
                    {siteText(
                      "account.your-premium-membership-is-checked-when-you-open-the-session-even",
                    )}
                  </p>
                </>
              ) : (
                <p className="next-circle-note">
                  {siteText("account.your-meeting-link-will-be-added-soon")}
                </p>
              )
            ) : (
              <>
                <p className="next-circle-note">
                  {siteText(
                    "account.the-zoom-link-is-available-to-premium-members",
                  )}
                </p>
                <div className="next-circle-actions">
                  <Link className="btn" href="/account?tab=membership">
                    {siteText("account.unlock-my-zoom-link")}
                  </Link>
                </div>
              </>
            )}
          </section>
        ) : (
          <div className="card">
            <h3>{siteText("account.no-saturday-session-scheduled-yet")}</h3>
            <p>{siteText("account.check-back-soon-for-your-next-circle")}</p>
          </div>
        )}
        <section
          className="card section-top my-events"
          aria-labelledby="my-events-title"
        >
          <div className="latest-head">
            <h3 id="my-events-title">{siteText("events.my-events")}</h3>
            <Link href="/events">{siteText("events.browse")} →</Link>
          </div>
          {myEvents.length ? (
            <ul className="my-events-list">
              {myEvents.map((e) => (
                <li key={e.id}>
                  <Link href={`/event/${e.id}`}>
                    <span className="date-chip" aria-hidden="true">
                      <b>{fmtDate(e.date, { day: "numeric" })}</b>
                      {fmtDate(e.date, { month: "short" })}
                    </span>
                    <span>
                      <b>{e.title}</b>
                      <small>
                        {fmtDate(e.date)} · {fmtTime(e.start)} · {e.venue}
                      </small>
                    </span>
                  </Link>
                  <CalendarButtons event={eventCalendarEvent(e)} kind="event" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{siteText("events.my-none")}</p>
          )}
        </section>
        {messages.length ? (
          <section
            className="member-messages section-top"
            aria-labelledby="messages-title"
          >
            <h2 id="messages-title" className="member-section-title">
              <Icon name="mail" size={18} />
              {siteText("account.messages-from-sibel")}
            </h2>
            {messages.map((a) => (
              <div className="card" key={a.id}>
                <h3>{a.subject}</h3>
                <AnnouncementContent announcement={a} name={user.name} />
              </div>
            ))}
          </section>
        ) : null}
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
          <div className="card consult-card">
            <h3>{siteText("account.1-1-consultation")}</h3>
            {premium ? (
              <>
                {upcomingBookings.length ? (
                  <ul className="consult-list">
                    {upcomingBookings.map((b) => (
                      <li key={b.id}>
                        <span className="date-chip" aria-hidden="true">
                          <b>{fmtDate(b.date, { day: "numeric" })}</b>
                          {fmtDate(b.date, { month: "short" })}
                        </span>
                        <div className="consult-info">
                          <b>
                            {fmtDate(b.date)} {siteText("account.at")} {b.time}
                          </b>
                          <span className="consult-topic">{b.topic}</span>
                          <span
                            className={`badge b-${b.status === "confirmed" ? "ok" : "warn"}`}
                          >
                            {b.status === "pending"
                              ? "awaiting approval"
                              : b.status}
                          </span>
                          {b.status === "confirmed" ? (
                            <div className="consult-actions">
                              <CalendarButtons
                                event={bookingEvent(b)}
                                kind="booking"
                              />
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    {siteText("account.no-consultation-booked-yet-you-have")}{" "}
                    {Math.max(0, data.settings.consultsPerMonth - used)}{" "}
                    {siteText("account.left-this-month")}
                  </p>
                )}
                <div className="consult-footer">
                  {upcomingBookings.length ? (
                    <span className="muted">
                      {Math.max(0, data.settings.consultsPerMonth - used)}{" "}
                      {siteText("account.left-this-month")}
                    </span>
                  ) : (
                    <span />
                  )}
                  <Link className="btn btn-sm" href="/account?tab=book">
                    {siteText("account.book-a-time")}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="muted">
                  {siteText(
                    "account.one-on-one-time-with-sibel-is-a-premium-perk",
                  )}
                </p>
                <div className="consult-footer">
                  <Link className="btn btn-sm" href="/account?tab=membership">
                    {siteText("account.see-premium")}
                  </Link>
                </div>
              </>
            )}
          </div>
          <div className="card latest-card">
            <div className="latest-head">
              <h3>{siteText("account.latest-for-you")}</h3>
              <Link href="/account?tab=library">
                {siteText("account.open-library")} →
              </Link>
            </div>
            <ul className="latest-list">
              {posts
                .filter((p) => canView(p.access, user.role))
                .slice(0, 3)
                .map((p) => (
                  <li key={p.id}>
                    <Link className="latest-item" href={`/post/${p.id}`}>
                      <span className="latest-thumb">
                        <Image
                          {...postImageProps(p)}
                          alt=""
                          fill
                          sizes="76px"
                        />
                      </span>
                      <span className="latest-text">
                        <small>
                          {p.category} ·{" "}
                          {fmtDate(p.date, { month: "short", day: "numeric" })}
                        </small>
                        <b>{p.title}</b>
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>
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
            {tabs.map(([key, label, icon]) => (
              <Link
                className={key === tab ? "on" : ""}
                aria-current={key === tab ? "page" : undefined}
                key={key}
                href={`/account?tab=${key}`}
              >
                <Icon name={icon} size={18} />
                <span>{siteText(`account.tab-${key}`) || label}</span>
                {premiumTabs.includes(key) && !premium ? (
                  <span className="tab-lock" title="Premium">
                    <Icon name="lock" size={14} />
                    <span className="visually-hidden">Premium</span>
                  </span>
                ) : null}
              </Link>
            ))}
            {user.role === "admin" ? (
              <Link href="/admin">
                <Icon name="sliders" size={18} />
                <span>{siteText("account.admin-panel")}</span>
              </Link>
            ) : null}
          </nav>
          <form action={signOut}>
            <button className="side-signout">
              <Icon name="logout" size={18} />
              {siteText("account.sign-out")}
            </button>
          </form>
        </aside>
        <div className="account-content">{content}</div>
      </div>
    </div>
  );
}
