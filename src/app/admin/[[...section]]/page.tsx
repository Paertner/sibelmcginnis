import { AdminDialog } from "@/components/admin-dialog";
import { SiteContentEditor } from "@/components/site-content-editor";
import { SiteContentTabs } from "@/components/site-content-tabs";
import { SiteImageEditor } from "@/components/site-image-editor";
import { siteImage, siteImageSlots } from "@/lib/site-images";
import { AdminTable, AdminRow } from "@/components/admin-table";
import { AnnouncementComposer } from "@/components/announcement-composer";
import { AnnouncementHistory } from "@/components/announcement-history";
import { memberRole } from "@/lib/membership";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getStore, upcomingSessions } from "@/lib/store";
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
const sections = [
  ["dashboard", "Dashboard", "📊"],
  ["members", "Members", "👥"],
  ["posts", "Blog posts", "📝"],
  ["sessions", "Saturday sessions", "🎥"],
  ["podcast", "Podcast", "🎧"],
  ["consults", "Consultations", "📅"],
  ["announce", "Announcements", "✉️"],
  ["content", "Site content", "🖼️"],
];
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ q?: string; tier?: string; access?: string }>;
}) {
  await requireAdmin();
  const route = (await params).section ?? [],
    section = route[0] ?? "dashboard";
  if (route.length > 1 || !sections.some(([key]) => key === section))
    notFound();
  await searchParams;
  const data = getStore(),
    settings = data.settings;
  const title = sections.find(([key]) => key === section)![1];
  const active = data.members.filter((m) => m.status === "active"),
    premium = active.filter((m) => m.tier === "premium");
  const upcoming = data.bookings
    .filter((b) => b.date >= today() && b.status !== "cancelled")
    .toSorted((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcomingSessions()[0];
  const name = (id: string) =>
    data.members.find((m) => m.id === id)?.name ?? "Removed member";
  return (
    <div className="ad">
      <aside className="ad-side">
        <Link className="brand" href="/">
          Sibel McGinnis
        </Link>
        <small>Admin panel</small>
        <nav aria-label="Admin navigation">
          {sections.map(([key, label, icon]) => (
            <Link
              className={key === section ? "on" : ""}
              href={key === "dashboard" ? "/admin" : `/admin/${key}`}
              key={key}
              aria-current={key === section ? "page" : undefined}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sp" />
        <Link href="/">↗ View website</Link>
        <form action={signOut}>
          <button className="side-signout">Sign out</button>
        </form>
      </aside>
      <main className="ad-main">
        <div className="ad-top">
          <h1>{title}</h1>
          <div className="admin-head-actions">
            {section === "members" ? <MemberEditor /> : null}
            {section === "posts" ? <PostEditor /> : null}
            {section === "podcast" ? <EpisodeEditor /> : null}
            {section === "sessions" ? (
              <>
                <ActionForm
                  action={adminMutation}
                  submitLabel="+ Add next Saturday"
                >
                  <EntityFields entity="sessions" />
                  <input type="hidden" name="op" value="next" />
                </ActionForm>
                <SessionEditor episodes={data.podcasts} />
              </>
            ) : null}
            {section === "dashboard" || section === "content" ? (
              <Link className="btn btn-sm btn-ghost" href="/">
                {section === "content" ? "Preview site ↗" : "View site ↗"}
              </Link>
            ) : null}
          </div>
        </div>
        {section === "dashboard" ? (
          <>
            <div className="stats">
              {[
                [active.length, "Active members"],
                [premium.length, "Premium members"],
                [
                  `$${premium.length * settings.premiumPrice}`,
                  "Monthly recurring revenue",
                ],
                [upcoming.length, "Upcoming consultations"],
              ].map(([value, label]) => (
                <div className="stat" key={label}>
                  <b>{value}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="grid g2">
              <div className="panel">
                <h3>Next Saturday session</h3>
                {next ? (
                  <>
                    <p style={{ marginBottom: 4 }}>
                      <b>{fmtDate(next.date)}</b> · {settings.meetingTime}
                    </p>
                    <p className="muted">Topic: {next.topic}</p>
                    <p className="meeting-link">
                      Zoom: {next.zoom || "No meeting link yet"}
                    </p>
                  </>
                ) : (
                  <p>No sessions scheduled.</p>
                )}
                <Link className="btn btn-sm" href="/admin/sessions">
                  Edit sessions &amp; Zoom link
                </Link>
              </div>
              <div className="panel">
                <h3>New members · last 6 months</h3>
                <div className="bars">
                  {Array.from({ length: 6 }, (_, i) => {
                    const d = new Date(today() + "T12:00:00Z");
                    d.setUTCDate(1);
                    d.setUTCMonth(d.getUTCMonth() - (5 - i));
                    const count = data.members.filter(
                      (m) =>
                        m.joined.slice(0, 7) === d.toISOString().slice(0, 7),
                    ).length;
                    return (
                      <div key={i}>
                        <i
                          className={i === 5 ? "cur" : ""}
                          style={{
                            height: Math.max(
                              4,
                              (count /
                                Math.max(
                                  1,
                                  ...Array.from({ length: 6 }, (_, j) => {
                                    const month = new Date(
                                      today() + "T12:00:00Z",
                                    );
                                    month.setUTCDate(1);
                                    month.setUTCMonth(
                                      month.getUTCMonth() - (5 - j),
                                    );
                                    return data.members.filter(
                                      (m) =>
                                        m.joined.slice(0, 7) ===
                                        month.toISOString().slice(0, 7),
                                    ).length;
                                  }),
                                )) *
                                100,
                            ),
                          }}
                        />
                        {d.toLocaleDateString("en-US", {
                          month: "short",
                          timeZone: "UTC",
                        })}
                        <br />
                        <b>{count}</b>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid g2">
              <div className="panel">
                <h3>Upcoming consultations</h3>
                {upcoming.length ? (
                  upcoming.slice(0, 5).map((b) => (
                    <div className="list-item" key={b.id}>
                      <div>
                        <b>{name(b.memberId)}</b>
                        <br />
                        <small className="muted">
                          {fmtDate(b.date, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · {b.time} — {b.topic}
                        </small>
                      </div>
                      <span className="badge b-ok">{b.status}</span>
                    </div>
                  ))
                ) : (
                  <p>None booked.</p>
                )}
              </div>
              <div className="panel">
                <h3>Recent members</h3>
                {data.members
                  .toSorted((a, b) => b.joined.localeCompare(a.joined))
                  .slice(0, 5)
                  .map((m) => (
                    <div className="list-item" key={m.id}>
                      <div>
                        <b>{m.name}</b>
                        <br />
                        <small>
                          Joined{" "}
                          {fmtDate(m.joined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </small>
                      </div>
                      <span className={`badge b-${m.tier}`}>{m.tier}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="panel">
              <h3>Quick actions</h3>
              <div className="hero-btns">
                <Link className="btn btn-sm" href="/admin/posts">
                  + New blog post
                </Link>
                <Link className="btn btn-sm btn-ghost" href="/admin/announce">
                  Email members
                </Link>
                <Link className="btn btn-sm btn-ghost" href="/admin/consults">
                  Set availability
                </Link>
              </div>
            </div>
          </>
        ) : null}
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
                      <b>{m.name}</b>
                      {m.note && (
                        <>
                          <br />
                          <small className="muted">📌 {m.note}</small>
                        </>
                      )}
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
          <>
            <p className="hint">
              Choose who can read each post: everyone, free members, or premium
              members only.
            </p>
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
                      <AdminRow
                        key={p.id}
                        category={p.access}
                        status={p.status}
                      >
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
          </>
        ) : null}
        {section === "sessions" ? (
          <>
            <ActionForm
              action={adminMutation}
              className="panel"
              submitLabel="Save"
            >
              <EntityFields entity="content" />
              <input
                type="hidden"
                name="heroTitle"
                value={settings.heroTitle}
              />
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
              <h3>Weekly meeting</h3>
              <p className="hint">
                Every Saturday gets its own Zoom link and passcode. Members
                enter through a protected link that checks their current Premium
                access.
              </p>
              <div className="row">
                <label className="field">
                  Meeting day
                  <input value="Saturday" readOnly />
                </label>
                <Field
                  name="meetingTime"
                  label="Time"
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
                />{" "}
                Create a new placeholder Zoom link automatically for every new
                Saturday
              </label>
            </ActionForm>
            <div className="panel">
              <h3>Schedule, Zoom links &amp; notes</h3>
              <div className="tcell">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Topic</th>
                      <th>Zoom link &amp; passcode</th>
                      <th>Notes</th>
                      <th>Podcast</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions
                      .toSorted((a, b) => a.date.localeCompare(b.date))
                      .map((s) => (
                        <tr key={s.id}>
                          <td>
                            <b>
                              {fmtDate(s.date, {
                                month: "short",
                                day: "numeric",
                              })}
                            </b>
                            {s.id === next?.id && (
                              <>
                                {" "}
                                <span className="badge b-ok">next</span>
                              </>
                            )}
                          </td>
                          <td>{s.topic}</td>
                          <td className="admin-zoom">
                            {s.zoom ? (
                              <>
                                {s.zoom.replace("https://", "")}
                                <br />
                                <span className="muted">
                                  Passcode {s.pass || "—"}
                                </span>
                              </>
                            ) : (
                              <span className="badge b-warn">no link</span>
                            )}
                          </td>
                          <td>{s.notes ? "✓" : "—"}</td>
                          <td>{s.podcast ? "✓" : "—"}</td>
                          <td className="admin-row-actions">
                            <ActionForm
                              action={adminMutation}
                              submitLabel="New link"
                            >
                              <EntityFields entity="sessions" id={s.id} />
                              <input
                                type="hidden"
                                name="op"
                                value="regenerate"
                              />
                            </ActionForm>{" "}
                            <SessionEditor
                              session={s}
                              episodes={data.podcasts}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
        {section === "podcast" ? (
          <>
            <p className="hint">
              Episodes are audio files visible to Premium members only. Link an
              episode to a Saturday session in the Sessions page.
            </p>
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
                            `🎵 ${ep.audioName}`
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
                                  src={`/api/audio/${ep.id}`}
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
                        No episodes yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </AdminTable>
          </>
        ) : null}
        {section === "consults" ? (
          <>
            <ActionForm
              action={adminMutation}
              className="availability-form"
              submitLabel="Save rules & availability"
            >
              <EntityFields entity="availability" />
              <div className="panel">
                <h3>Your availability</h3>
                <p className="hint">
                  Open times that members can book. Existing reservations stay
                  in place when availability changes.
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
            <div className="panel">
              <h3>Bookings</h3>
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
                    {data.bookings
                      .toSorted((a, b) =>
                        (b.date + b.time).localeCompare(a.date + a.time),
                      )
                      .map((b) => (
                        <tr key={b.id}>
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
                            <Status value={b.status} />
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
                            {b.status !== "cancelled" && (
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
                          No bookings yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
        {section === "content" ? (
          <SiteContentTabs
            settings={<ContentForm settings={settings} />}
            text={<SiteContentEditor values={data.siteCopy ?? {}} />}
            images={
              <SiteImageEditor
                images={siteImageSlots().map((slot) => siteImage(slot.id))}
              />
            }
          />
        ) : null}
      </main>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const color = ["active", "confirmed", "published"].includes(value)
    ? "ok"
    : ["pending", "paused"].includes(value)
      ? "warn"
      : value === "cancelled"
        ? "bad"
        : "grey";
  return <span className={`badge b-${color}`}>{value}</span>;
}
