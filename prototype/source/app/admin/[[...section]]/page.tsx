import { assetUrl } from "../../../../preview/assets";
import { AdminDialog } from "@/components/admin-dialog";
import { AdminDashboard } from "@/components/admin-dashboard";
import { Icon, type IconName } from "@/components/admin-icons";
import { MediaLibrary } from "@/components/media-library";
import { SiteContentEditor } from "@/components/site-content-editor";
import { SiteContentTabs } from "@/components/site-content-tabs";
import { mediaLibrary, siteImage, siteImageSlots } from "@/lib/site-images";
import { AdminTable, AdminRow } from "@/components/admin-table";
import { AnnouncementComposer } from "@/components/announcement-composer";
import { AnnouncementHistory } from "@/components/announcement-history";
import { CopyLink } from "@/components/copy-link";
import { memberRole } from "@/lib/membership";
import { meetingUrl } from "@/lib/site-url";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getStore, upcomingSessions, type Session } from "@/lib/store";
import { fmtDate, today } from "@/lib/dates";
import { adminMutation, cancelBooking, signOut } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import {
  ContentForm,
  EntityFields,
  EpisodeEditor,
  Field,
  MemberEditor,
  PostEditor,
  SessionEditor,
} from "@/components/admin-forms";
export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
const sections: [string, string, IconName, string][] = [
  ["dashboard", "Dashboard", "home", ""],
  [
    "members",
    "Members",
    "users",
    "Everyone with an account, their membership and status.",
  ],
  [
    "posts",
    "Blog posts",
    "pen",
    "Write posts and choose who can read each one.",
  ],
  [
    "sessions",
    "Saturday sessions",
    "video",
    "Plan each Saturday circle, its Zoom link and follow-up.",
  ],
  ["podcast", "Podcast", "headphones", "Audio episodes for Premium members."],
  [
    "consults",
    "Consultations",
    "calendar",
    "Bookings, your open times and consultation rules.",
  ],
  [
    "announce",
    "Announcements",
    "mail",
    "Send a message to members’ accounts and prepare emails.",
  ],
  [
    "media",
    "Media library",
    "image",
    "Every image on the site, and the photos you upload.",
  ],
  [
    "content",
    "Site content",
    "text",
    "Homepage settings and all the wording on the site.",
  ],
];
const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ q?: string; tier?: string; access?: string }>;
}) {
  const user = await requireAdmin();
  const route = (await params).section ?? [],
    section = route[0] ?? "dashboard";
  if (route.length > 1 || !sections.some(([key]) => key === section))
    notFound();
  await searchParams;
  const data = getStore(),
    settings = data.settings;
  const [, title, , subtitle] = sections.find(([key]) => key === section)!;
  const next = upcomingSessions()[0];
  const name = (id: string) =>
    data.members.find((m) => m.id === id)?.name ?? "Removed member";
  return (
    <div className="ad">
      <aside className="ad-side">
        <Link className="ad-brand" href="/">
          <span className="ad-brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            Sibel McGinnis
            <small>Admin</small>
          </span>
        </Link>
        <nav aria-label="Admin navigation">
          {sections.map(([key, label, icon]) => (
            <Link
              className={key === section ? "on" : ""}
              href={key === "dashboard" ? "/admin" : `/admin/${key}`}
              key={key}
              aria-current={key === section ? "page" : undefined}
            >
              <Icon name={icon} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sp" />
        <div className="ad-side-foot">
          <Link href="/">
            <Icon name="external" />
            View website
          </Link>
          <form action={signOut}>
            <button className="side-signout">
              <Icon name="logout" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="ad-main">
        <div className="ad-top">
          <div className="ad-title">
            <h1>
              {section === "dashboard"
                ? `Welcome back, ${user.name.split(" ")[0]}`
                : title}
            </h1>
            <p>
              {section === "dashboard"
                ? fmtDate(today(), {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : subtitle}
            </p>
          </div>
          <div className="admin-head-actions">
            {section === "members" ? <MemberEditor /> : null}
            {section === "posts" ? <PostEditor /> : null}
            {section === "podcast" ? <EpisodeEditor /> : null}
            {section === "sessions" ? (
              <>
                <SessionEditor episodes={data.podcasts} />
                <ActionForm
                  action={adminMutation}
                  submitLabel="+ Add next Saturday"
                >
                  <EntityFields entity="sessions" />
                  <input type="hidden" name="op" value="next" />
                </ActionForm>
              </>
            ) : null}
            {section === "dashboard" ? (
              <>
                <Link className="btn btn-sm btn-ghost" href="/admin/announce">
                  Email members
                </Link>
                <Link className="btn btn-sm" href="/admin/posts">
                  + New blog post
                </Link>
              </>
            ) : null}
            {section === "content" || section === "media" ? (
              <Link className="btn btn-sm btn-ghost" href="/">
                Preview site ↗
              </Link>
            ) : null}
            <span className="ad-user" title={user.name}>
              <span className="avatar-soft" aria-hidden="true">
                {initials(user.name)}
              </span>
              <span className="ad-user-name">
                {user.name}
                <small>Administrator</small>
              </span>
            </span>
          </div>
        </div>
        {section === "dashboard" ? <AdminDashboard data={data} /> : null}
        {section === "members" ? (
          <AdminTable kind="members" count={data.members.length}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <AdminRow
                    key={m.id}
                    search={`${m.name} ${m.email}`}
                    category={m.tier}
                  >
                    <td>
                      <span className="person">
                        <span className="avatar-soft" aria-hidden="true">
                          {initials(m.name)}
                        </span>
                        <span>
                          <b>{m.name}</b>
                          {m.note && (
                            <small className="muted person-note">
                              {m.note}
                            </small>
                          )}
                        </span>
                      </span>
                    </td>
                    <td>{m.email}</td>
                    <td>
                      <span className={`badge b-${m.tier}`}>{m.tier}</span>
                    </td>
                    <td>
                      <Status value={m.status} />
                    </td>
                    <td>
                      {fmtDate(m.joined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <MemberEditor member={m} />
                    </td>
                  </AdminRow>
                ))}
              </tbody>
            </table>
          </AdminTable>
        ) : null}
        {section === "posts" ? (
          <AdminTable kind="posts">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Visible to</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.posts
                  .toSorted((a, b) => b.date.localeCompare(a.date))
                  .map((p) => (
                    <AdminRow key={p.id} category={p.access} status={p.status}>
                      <td>
                        <b>{p.title}</b>
                        <br />
                        <small className="muted">{p.category}</small>
                      </td>
                      <td>
                        <span className={`badge b-${p.access}`}>
                          {p.access === "public" ? "Everyone" : p.access}
                        </span>
                      </td>
                      <td>
                        <Status value={p.status} />
                      </td>
                      <td>
                        {fmtDate(p.date, { month: "short", day: "numeric" })}
                      </td>
                      <td className="admin-row-actions">
                        <PostEditor post={p} />{" "}
                        <Link
                          className="btn btn-sm btn-ghost"
                          href={`/post/${p.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </AdminRow>
                  ))}
              </tbody>
            </table>
          </AdminTable>
        ) : null}
        {section === "sessions" ? (
          <SessionsPage
            sessions={data.sessions}
            next={next}
            episodes={data.podcasts}
            settings={settings}
          />
        ) : null}
        {section === "podcast" ? (
          <AdminTable>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Episode</th>
                  <th>Date</th>
                  <th>Length</th>
                  <th>Audio</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {data.podcasts
                  .toSorted((a, b) => b.num - a.num)
                  .map((ep) => (
                    <tr key={ep.id}>
                      <td>
                        <b>{ep.num}</b>
                      </td>
                      <td>
                        <b>{ep.title}</b>
                      </td>
                      <td>
                        {fmtDate(ep.date, { month: "short", day: "numeric" })}
                      </td>
                      <td>{ep.duration}</td>
                      <td>
                        {ep.audioName ? (
                          <span className="file-chip">
                            <Icon name="headphones" size={14} />
                            {ep.audioName}
                          </span>
                        ) : (
                          <span className="muted">No audio uploaded</span>
                        )}
                      </td>
                      <td>
                        <Status value={ep.status} />
                      </td>
                      <td className="admin-row-actions">
                        <EpisodeEditor episode={ep} />
                        {ep.audioName && (
                          <>
                            {" "}
                            <AdminDialog
                              title={`Preview #${ep.num}: ${ep.title}`}
                              trigger="▶"
                            >
                              <audio
                                controls
                                preload="none"
                                src={assetUrl(`/api/audio/${ep.id}`)}
                              />
                            </AdminDialog>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                {!data.podcasts.length && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No episodes yet. Add one with + New episode.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </AdminTable>
        ) : null}
        {section === "consults" ? (
          <>
            <section className="panel" aria-labelledby="bookings-title">
              <header className="card-head">
                <div>
                  <h2 id="bookings-title">Bookings</h2>
                  <p className="card-sub">
                    {
                      data.bookings.filter(
                        (b) => b.status === "pending" && b.date >= today(),
                      ).length
                    }{" "}
                    waiting for confirmation ·{" "}
                    {
                      data.bookings.filter(
                        (b) => b.status !== "cancelled" && b.date >= today(),
                      ).length
                    }{" "}
                    upcoming
                  </p>
                </div>
              </header>
              <div className="tcell">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Member</th>
                      <th>Topic</th>
                      <th>Status</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...data.bookings
                        .filter((b) => b.date >= today())
                        .toSorted((a, b) =>
                          (a.date + a.time).localeCompare(b.date + b.time),
                        ),
                      ...data.bookings
                        .filter((b) => b.date < today())
                        .toSorted((a, b) =>
                          (b.date + b.time).localeCompare(a.date + a.time),
                        ),
                    ].map((b) => (
                      <tr
                        key={b.id}
                        className={b.date < today() ? "is-past" : ""}
                      >
                        <td>
                          <b>
                            {fmtDate(b.date, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </b>{" "}
                          · {b.time}
                        </td>
                        <td>{name(b.memberId)}</td>
                        <td>{b.topic}</td>
                        <td>
                          <Status
                            value={
                              b.date < today() && b.status === "confirmed"
                                ? "completed"
                                : b.status
                            }
                          />
                        </td>
                        <td className="admin-row-actions">
                          {b.status === "pending" && (
                            <ActionForm
                              action={adminMutation}
                              submitLabel="Confirm"
                            >
                              <EntityFields entity="bookings" id={b.id} />
                            </ActionForm>
                          )}
                          {b.status !== "cancelled" && b.date >= today() && (
                            <ActionForm
                              action={cancelBooking}
                              submitLabel="Cancel"
                            >
                              <input name="id" type="hidden" value={b.id} />
                            </ActionForm>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!data.bookings.length && (
                      <tr>
                        <td colSpan={5} className="muted">
                          No bookings yet. Members can book as soon as you open
                          times below.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <ActionForm
              action={adminMutation}
              className="availability-form"
              submitLabel="Save rules & availability"
            >
              <EntityFields entity="availability" />
              <div className="panel">
                <h3>Your availability</h3>
                <p className="hint">
                  Tick the times members can book. Existing bookings stay in
                  place when you change these.
                </p>
                {[1, 2, 3, 4, 5, 6, 0].map((index) => {
                  const day = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ][index];
                  return (
                    <div className="day" key={day}>
                      <b>{day.slice(0, 3)}</b>
                      <div className="slots">
                        {Array.from(
                          { length: 13 },
                          (_, i) => `${String(i + 9).padStart(2, "0")}:00`,
                        ).map((time) => (
                          <label className="slot-check" key={time}>
                            <input
                              name={`day${index}`}
                              type="checkbox"
                              value={time}
                              defaultChecked={(
                                (data.availability as Record<string, string[]>)[
                                  index
                                ] ?? []
                              ).includes(time)}
                            />
                            {time}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="panel">
                <h3>Consultation rules</h3>
                <div className="row">
                  <Field
                    name="consultsPerMonth"
                    label="Included per month (Premium)"
                    value={settings.consultsPerMonth}
                    type="number"
                  />
                  <Field
                    name="consultMinutes"
                    label="Length (minutes)"
                    value={settings.consultMinutes}
                    type="number"
                  />
                </div>
                <label className="checkbox-field">
                  <input
                    name="autoConfirm"
                    type="checkbox"
                    defaultChecked={settings.autoConfirm}
                  />{" "}
                  Confirm automatically and create a placeholder meeting
                </label>
              </div>
            </ActionForm>
          </>
        ) : null}
        {section === "announce" ? (
          <div className="admin-announcements">
            <AnnouncementComposer
              members={data.members.map((member) => ({
                id: member.id,
                name: member.name,
                email: member.email,
                tier: memberRole(member),
              }))}
            />
            <AnnouncementHistory />
          </div>
        ) : null}
        {section === "media" ? (
          <MediaLibrary
            media={mediaLibrary()}
            slots={siteImageSlots().map((slot) => siteImage(slot.id))}
          />
        ) : null}
        {section === "content" ? (
          <SiteContentTabs
            settings={<ContentForm settings={settings} />}
            text={<SiteContentEditor values={data.siteCopy ?? {}} />}
          />
        ) : null}
      </main>
    </div>
  );
}

function SessionsPage({
  sessions,
  next,
  episodes,
  settings,
}: {
  sessions: Session[];
  next?: Session;
  episodes: Parameters<typeof SessionEditor>[0]["episodes"];
  settings: ReturnType<typeof getStore>["settings"];
}) {
  const upcoming = sessions
    .filter((s) => s.date >= today() && s.id !== next?.id)
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const past = sessions
    .filter((s) => s.date < today())
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const followUps = past.filter(
    (s) => !s.notes || !episodes.some((ep) => ep.id === s.podcast),
  ).length;
  const episode = (s: Session) => episodes.find((ep) => ep.id === s.podcast);
  return (
    <div className="sessions-page">
      <div className="sessions-top">
        {next ? (
          <section className="next-circle" aria-labelledby="next-circle-title">
            <p className="next-circle-eyebrow">Next circle</p>
            <div className="next-circle-row">
              <span className="date-block" aria-hidden="true">
                <small>{fmtDate(next.date, { weekday: "short" })}</small>
                <b>{fmtDate(next.date, { day: "numeric" })}</b>
                <small>{fmtDate(next.date, { month: "short" })}</small>
              </span>
              <div>
                <h2 id="next-circle-title">{next.topic}</h2>
                <p>
                  {fmtDate(next.date)} · {settings.meetingTime} ·{" "}
                  {settings.meetingMinutes} minutes
                </p>
              </div>
            </div>
            <ul className="status-pills">
              <li className={next.zoom ? "ok" : "warn"}>
                <Icon name={next.zoom ? "check" : "clock"} size={15} />
                {next.zoom ? "Zoom link ready" : "Add a Zoom link"}
              </li>
              <li className={next.pass ? "ok" : "warn"}>
                <Icon name={next.pass ? "lock" : "clock"} size={15} />
                {next.pass ? `Passcode ${next.pass}` : "No passcode"}
              </li>
            </ul>
            <div className="next-circle-actions">
              <SessionEditor session={next} episodes={episodes} />
              <ActionForm action={adminMutation} submitLabel="New Zoom link">
                <EntityFields entity="sessions" id={next.id} />
                <input type="hidden" name="op" value="regenerate" />
              </ActionForm>
              <CopyLink value={meetingUrl("session", next.id)} />
            </div>
            <p className="next-circle-note">
              Members join through their protected link. It checks Premium
              access every time, so the Zoom details are never shared directly.
            </p>
          </section>
        ) : (
          <section className="next-circle empty">
            <h2>No Saturday planned</h2>
            <p>Add the next Saturday to open it to members.</p>
          </section>
        )}
        <ActionForm
          action={adminMutation}
          className="panel weekly-settings"
          submitLabel="Save weekly settings"
        >
          <EntityFields entity="content" />
          <input type="hidden" name="heroTitle" value={settings.heroTitle} />
          <input type="hidden" name="heroSub" value={settings.heroSub} />
          <input
            type="hidden"
            name="topics"
            value={settings.topics.join("\n")}
          />
          <input
            type="hidden"
            name="premiumPrice"
            value={settings.premiumPrice}
          />
          <h3>
            <Icon name="sliders" size={18} /> Every Saturday
          </h3>
          <div className="row">
            <Field
              name="meetingTime"
              label="Start time"
              value={settings.meetingTime}
            />
            <Field
              name="meetingMinutes"
              label="Length (minutes)"
              type="number"
              value={settings.meetingMinutes}
            />
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              name="autoZoom"
              defaultChecked={settings.autoZoom}
            />
            Create a Zoom link automatically when I add a Saturday
          </label>
        </ActionForm>
      </div>

      <section className="panel" aria-labelledby="upcoming-title">
        <header className="card-head">
          <div>
            <h2 id="upcoming-title">Coming up</h2>
            <p className="card-sub">
              {upcoming.length
                ? `${upcoming.length} more Saturday${upcoming.length === 1 ? "" : "s"} planned`
                : "Nothing planned after the next circle yet"}
            </p>
          </div>
        </header>
        {upcoming.length ? (
          <ul className="session-list">
            {upcoming.map((s) => (
              <li key={s.id}>
                <span className="date-chip">
                  <b>{fmtDate(s.date, { day: "numeric" })}</b>
                  {fmtDate(s.date, { month: "short" })}
                </span>
                <div className="session-main">
                  <b>{s.topic}</b>
                  <ul className="status-pills small">
                    <li className={s.zoom ? "ok" : "warn"}>
                      {s.zoom ? "Zoom ready" : "No Zoom link"}
                    </li>
                    {s.pass ? <li className="ok">Passcode {s.pass}</li> : null}
                  </ul>
                </div>
                <div className="admin-row-actions">
                  <ActionForm action={adminMutation} submitLabel="New link">
                    <EntityFields entity="sessions" id={s.id} />
                    <input type="hidden" name="op" value="regenerate" />
                  </ActionForm>
                  <SessionEditor session={s} episodes={episodes} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-note">
            Use + Add next Saturday to plan the following week.
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="past-title">
        <header className="card-head">
          <div>
            <h2 id="past-title">After the circle</h2>
            <p className="card-sub">
              {followUps
                ? `${followUps} session${followUps === 1 ? "" : "s"} still need notes or a podcast episode`
                : "All past sessions have notes and an episode"}
            </p>
          </div>
        </header>
        <ul className="session-list">
          {past.map((s) => (
            <li key={s.id}>
              <span className="date-chip muted-chip">
                <b>{fmtDate(s.date, { day: "numeric" })}</b>
                {fmtDate(s.date, { month: "short" })}
              </span>
              <div className="session-main">
                <b>{s.topic}</b>
                <ul className="status-pills small">
                  <li className={s.notes ? "ok" : "warn"}>
                    <Icon name={s.notes ? "check" : "notes"} size={13} />
                    {s.notes ? "Notes shared" : "Notes missing"}
                  </li>
                  <li className={episode(s) ? "ok" : "warn"}>
                    <Icon
                      name={episode(s) ? "check" : "headphones"}
                      size={13}
                    />
                    {episode(s)
                      ? `Episode #${episode(s)!.num}`
                      : "No podcast episode"}
                  </li>
                </ul>
              </div>
              <div className="admin-row-actions">
                <SessionEditor session={s} episodes={episodes} />
              </div>
            </li>
          ))}
          {!past.length ? (
            <li className="empty-note">Past Saturdays will appear here.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const color = ["active", "confirmed", "published", "completed"].includes(
    value,
  )
    ? "ok"
    : ["pending", "paused"].includes(value)
      ? "warn"
      : value === "cancelled"
        ? "bad"
        : "grey";
  return <span className={`badge b-${color}`}>{value}</span>;
}
