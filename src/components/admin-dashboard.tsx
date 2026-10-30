import Link from "next/link";
import { Icon, type IconName } from "./admin-icons";
import { clock, fmtDate, today } from "@/lib/dates";
import { upcomingSessions, type Store } from "@/lib/store";
import { fmtTime } from "@/lib/event-posts";
import { ActionForm } from "./action-form";
import { adminMutation } from "@/lib/actions";
import { bookingName } from "@/lib/company-links";

type Point = { key: string; label: string; value: number };

// Month keys (YYYY-MM) ending with the current month.
function lastMonths(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today() + "T12:00:00Z");
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (count - 1 - i));
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    };
  });
}

const percent = (now: number, before: number) =>
  before ? Math.round(((now - before) / before) * 100) : now ? 100 : 0;

function Delta({
  value,
  suffix = "vs last month",
}: {
  value: number;
  suffix?: string;
}) {
  const tone = value > 0 ? "up" : value < 0 ? "down" : "flat";
  return (
    <span className={`kpi-delta ${tone}`}>
      {value > 0 ? "+" : ""}
      {value}% <span>{suffix}</span>
    </span>
  );
}

// Monotone cubic interpolation: a smooth curve that never dips below zero between points.
function smoothPath(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return "";
  const slopes = points
    .slice(0, -1)
    .map((p, i) => (points[i + 1].y - p.y) / (points[i + 1].x - p.x));
  const tangents = points.map((_, i) =>
    i === 0
      ? slopes[0]
      : i === n - 1
        ? slopes[n - 2]
        : slopes[i - 1] * slopes[i] <= 0
          ? 0
          : (slopes[i - 1] + slopes[i]) / 2,
  );
  for (let i = 0; i < n - 1; i++) {
    if (!slopes[i]) {
      tangents[i] = tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i],
      b = tangents[i + 1] / slopes[i],
      s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      tangents[i] = t * a * slopes[i];
      tangents[i + 1] = t * b * slopes[i];
    }
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p = points[i],
      q = points[i + 1],
      dx = (q.x - p.x) / 3;
    d += ` C${p.x + dx},${p.y + tangents[i] * dx} ${q.x - dx},${q.y - tangents[i + 1] * dx} ${q.x},${q.y}`;
  }
  return d;
}

export function MembersChart({ points }: { points: Point[] }) {
  const W = 640,
    H = 300,
    left = 36,
    right = 18,
    top = 46,
    bottom = 34;
  const step = Math.max(
    1,
    Math.ceil(Math.max(...points.map((p) => p.value)) / 4),
  );
  const max = step * 4;
  const x = (i: number) =>
    left + (i * (W - left - right)) / (points.length - 1);
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
  const coords = points.map((p, i) => ({ x: x(i), y: y(p.value) }));
  const line = smoothPath(coords);
  const area = `${line} L${coords.at(-1)!.x},${H - bottom} L${coords[0].x},${H - bottom} Z`;
  const peak = points.reduce(
    (best, p, i) => (p.value >= points[best].value ? i : best),
    0,
  );
  const column = (W - left - right) / (points.length - 1);
  return (
    <figure className="members-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="New members per month"
      >
        <defs>
          <linearGradient id="members-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ad-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--ad-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} className="chart-grid">
            <line x1={left} x2={W - right} y1={y(step * i)} y2={y(step * i)} />
            <text x={left - 10} y={y(step * i) + 4} textAnchor="end">
              {step * i}
            </text>
          </g>
        ))}
        <path className="chart-area" d={area} fill="url(#members-fill)" />
        <path className="chart-line" d={line} />
        {points.map((p, i) => {
          const c = coords[i],
            label = `${p.value} new`,
            width = label.length * 7 + 18,
            tipX = Math.min(Math.max(c.x - width / 2, left), W - right - width);
          return (
            <g
              key={p.key}
              className={`chart-pt${i === peak ? " is-peak" : ""}`}
              tabIndex={0}
              aria-label={`${p.label}: ${label}`}
            >
              <rect
                className="chart-hit"
                x={c.x - column / 2}
                y={top - 30}
                width={column}
                height={H - top - bottom + 30}
              />
              <line
                className="chart-guide"
                x1={c.x}
                x2={c.x}
                y1={c.y}
                y2={H - bottom}
              />
              <circle cx={c.x} cy={c.y} r="5" />
              <g className="chart-tip">
                <rect x={tipX} y={c.y - 38} width={width} height="24" rx="7" />
                <text x={tipX + width / 2} y={c.y - 22} textAnchor="middle">
                  {label}
                </text>
              </g>
              <text
                className="chart-month"
                x={c.x}
                y={H - 10}
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="visually-hidden">
        <caption>New members per month</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Kpi({
  icon,
  label,
  value,
  children,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div className="kpi">
      <div className="kpi-head">
        <span className="kpi-icon">
          <Icon name={icon} />
        </span>
        <span className="kpi-label">{label}</span>
      </div>
      <b className="kpi-value">{value}</b>
      <div className="kpi-foot">{children}</div>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

export function AdminDashboard({ data }: { data: Store }) {
  const settings = data.settings,
    price = settings.premiumPrice,
    months = lastMonths(8),
    thisMonth = months.at(-1)!.key,
    lastMonth = months.at(-2)!.key;
  const active = data.members.filter((m) => m.status === "active");
  const joinedIn = (key: string) =>
    data.members.filter((m) => m.joined.slice(0, 7) === key);
  const newMembers = months.map((m) => ({
    ...m,
    value: joinedIn(m.key).length,
  }));
  // Estimate: a current Premium member has paid every month since joining. Stripe will replace this.
  const premiumSince = data.members.filter(
    (m) => m.tier === "premium" && m.status === "active",
  );
  const revenueFor = (key: string) =>
    premiumSince.filter((m) => m.joined.slice(0, 7) <= key).length * price;
  const revenue = months
    .slice(-6)
    .map((m) => ({ ...m, value: revenueFor(m.key) }));
  const revenueNow = revenueFor(thisMonth),
    revenueBefore = revenueFor(lastMonth);
  const lifetime = premiumSince.reduce((sum, m) => {
    const [y, mo] = m.joined.split("-").map(Number),
      [ty, tm] = thisMonth.split("-").map(Number);
    return sum + ((ty - y) * 12 + (tm - mo) + 1) * price;
  }, 0);
  const salesNow = premiumSince.filter(
      (m) => m.joined.slice(0, 7) === thisMonth,
    ).length,
    salesBefore = premiumSince.filter(
      (m) => m.joined.slice(0, 7) === lastMonth,
    ).length;
  const conversion = active.length
    ? Math.round((premiumSince.length / active.length) * 100)
    : 0;
  const bookings = data.bookings
    .filter((b) => b.date >= today() && b.status !== "cancelled")
    .toSorted((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const pending = bookings.filter((b) => b.status === "pending").length;
  const next = upcomingSessions()[0];
  const events = (data.events ?? [])
    .filter((e) => e.status === "published" && e.date >= today())
    .toSorted((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const notices = (data.notices ?? [])
    .filter((n) => !n.seen)
    .map((n) => ({
      notice: n,
      booking: data.bookings.find((b) => b.id === n.bookingId),
    }))
    .filter((n) => n.booking)
    .toSorted((a, b) => b.notice.createdAt.localeCompare(a.notice.createdAt));
  const revenueMax = Math.max(price, ...revenue.map((r) => r.value));
  return (
    <div className="dash">
      {notices.length ? (
        <section className="dash-notices" aria-label="New company bookings">
          {notices.map(({ notice, booking }) => (
            <div className="dash-notice" role="status" key={notice.id}>
              <span className="dash-notice-icon" aria-hidden="true">
                <Icon name="calendar" size={18} />
              </span>
              <div>
                <b>New company booking</b>
                <span>
                  {booking!.company} ({booking!.contact}) booked{" "}
                  {fmtDate(booking!.date, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  at {clock(booking!.time)}. Nothing was emailed.
                </span>
              </div>
              <Link className="btn btn-sm btn-ghost" href="/admin/consults">
                View
              </Link>
              <ActionForm action={adminMutation} submitLabel="Dismiss">
                <input name="entity" type="hidden" value="notices" />
                <input name="id" type="hidden" value={notice.id} />
                <input name="op" type="hidden" value="dismiss" />
              </ActionForm>
            </div>
          ))}
        </section>
      ) : null}
      <section className="kpis" aria-label="Key figures">
        <Kpi icon="users" label="Active members" value={active.length}>
          <span className="kpi-note">
            <b className="kpi-strong">{joinedIn(thisMonth).length}</b> joined
            this month · {joinedIn(lastMonth).length} last month
          </span>
        </Kpi>
        <Kpi icon="star" label="Premium members" value={premiumSince.length}>
          <span className="kpi-note">{conversion}% of active members</span>
        </Kpi>
        <Kpi
          icon="wallet"
          label="Monthly recurring revenue"
          value={`$${premiumSince.length * price}`}
        >
          <Delta value={percent(revenueNow, revenueBefore)} />
        </Kpi>
        <Kpi
          icon="calendar"
          label="Upcoming consultations"
          value={bookings.length}
        >
          <span className="kpi-note">
            {pending ? `${pending} waiting for confirmation` : "All confirmed"}
          </span>
        </Kpi>
      </section>

      <div className="dash-row dash-row-main">
        <section className="card-soft" aria-labelledby="members-chart-title">
          <header className="card-head">
            <div>
              <h2 id="members-chart-title">New members</h2>
              <p className="card-sub">Sign-ups per month, last 8 months</p>
            </div>
            <Link className="card-link" href="/admin/members">
              See all members
            </Link>
          </header>
          <MembersChart points={newMembers} />
        </section>

        <section className="card-soft sales" aria-labelledby="sales-title">
          <header className="card-head">
            <div>
              <h2 id="sales-title">Sales &amp; revenue</h2>
              <p className="card-sub">
                {fmtDate(today(), { month: "long", year: "numeric" })}
              </p>
            </div>
            <span
              className="chip-estimate"
              title="Calculated from current Premium memberships"
            >
              Estimated
            </span>
          </header>
          <div className="sales-hero">
            <b>${revenueNow.toLocaleString("en-US")}</b>
            <Delta value={percent(revenueNow, revenueBefore)} />
            <span className="kpi-note">Revenue this month</span>
          </div>
          <div
            className="revenue-bars"
            role="img"
            aria-label="Revenue per month, last 6 months"
          >
            {revenue.map((r, i) => (
              <div
                key={r.key}
                className={i === revenue.length - 1 ? "cur" : ""}
              >
                <i
                  style={{
                    height: `${Math.max(6, (r.value / revenueMax) * 100)}%`,
                  }}
                />
                <span>{r.label}</span>
              </div>
            ))}
          </div>
          <dl className="sales-list">
            <div>
              <dt>Premium sales this month</dt>
              <dd>
                {salesNow}
                <small>{salesBefore} last month</small>
              </dd>
            </div>
            <div>
              <dt>Free → Premium rate</dt>
              <dd>{conversion}%</dd>
            </div>
            <div>
              <dt>Revenue to date</dt>
              <dd>${lifetime.toLocaleString("en-US")}</dd>
            </div>
          </dl>
          <p className="card-foot-note">
            Based on ${price}/month per Premium member. Real payments appear
            here once Stripe is connected.
          </p>
        </section>
      </div>

      <div className="dash-row dash-row-three">
        <section
          className="card-soft session-glance"
          aria-labelledby="next-session-title"
        >
          <header className="card-head">
            <h2 id="next-session-title">Next session</h2>
            <Link className="card-link" href="/admin/sessions">
              Manage
            </Link>
          </header>
          {next ? (
            <>
              <p className="glance-date">
                <b>
                  {fmtDate(next.date, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </b>
                <span>
                  {settings.meetingTime} · {settings.meetingMinutes} min
                </span>
              </p>
              <p className="glance-topic">{next.topic}</p>
              <ul className="checklist">
                <li className={next.zoom ? "done" : ""}>
                  <Icon name={next.zoom ? "check" : "clock"} size={16} />
                  {next.zoom ? "Zoom link ready" : "Zoom link missing"}
                </li>
                <li className={next.pass ? "done" : ""}>
                  <Icon name={next.pass ? "check" : "clock"} size={16} />
                  {next.pass ? "Passcode set" : "No passcode"}
                </li>
              </ul>
            </>
          ) : (
            <p className="empty-note">
              No session scheduled. Add one from Weekly sessions.
            </p>
          )}
        </section>

        <section className="card-soft" aria-labelledby="consults-title">
          <header className="card-head">
            <h2 id="consults-title">Upcoming consultations</h2>
            <Link className="card-link" href="/admin/consults">
              See all
            </Link>
          </header>
          {bookings.length ? (
            <ul className="mini-list">
              {bookings.slice(0, 4).map((b) => (
                <li key={b.id}>
                  <span className="date-chip">
                    <b>{fmtDate(b.date, { day: "numeric" })}</b>
                    {fmtDate(b.date, { month: "short" })}
                  </span>
                  <div>
                    <b>
                      {b.source === "company" ? (
                        <span className="member-name">
                          {bookingName(b)}{" "}
                          <span className="badge b-grey">Company</span>
                        </span>
                      ) : (
                        <span className="member-name">
                          {bookingName(b)}
                          <Link
                            className="mail-link"
                            href={`/admin/announce?to=${b.memberId}`}
                            aria-label={`Send an announcement to ${bookingName(b)}`}
                            title="Send an announcement"
                          >
                            <Icon name="mail" size={14} />
                          </Link>
                        </span>
                      )}
                    </b>
                    <small>
                      {clock(b.time)} · {b.topic}
                    </small>
                  </div>
                  <span
                    className={`badge b-${b.status === "confirmed" ? "ok" : "warn"}`}
                  >
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">
              No consultations booked. Open more times in Consultations.
            </p>
          )}
        </section>

        <section className="card-soft" aria-labelledby="recent-title">
          <header className="card-head">
            <h2 id="recent-title">Recent members</h2>
            <Link className="card-link" href="/admin/members">
              See all
            </Link>
          </header>
          <ul className="mini-list">
            {data.members
              .toSorted((a, b) => b.joined.localeCompare(a.joined))
              .slice(0, 4)
              .map((m) => (
                <li key={m.id}>
                  <span className="avatar-soft" aria-hidden="true">
                    {initials(m.name)}
                  </span>
                  <div>
                    <b>
                      <span className="member-name">
                        {m.name}
                        <Link
                          className="mail-link"
                          href={`/admin/announce?to=${m.id}`}
                          aria-label={`Send an announcement to ${m.name}`}
                          title="Send an announcement"
                        >
                          <Icon name="mail" size={14} />
                        </Link>
                      </span>
                    </b>
                    <small>
                      Joined{" "}
                      {fmtDate(m.joined, { month: "short", day: "numeric" })}
                    </small>
                  </div>
                  <span className={`badge b-${m.tier}`}>{m.tier}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <div className="dash-row">
        <section className="card-soft" aria-labelledby="events-title">
          <header className="card-head">
            <h2 id="events-title">Upcoming events</h2>
            <Link className="card-link" href="/admin/events">
              See all
            </Link>
          </header>
          {events.length ? (
            <ul className="mini-list">
              {events.slice(0, 4).map((e) => (
                <li key={e.id}>
                  <span className="date-chip">
                    <b>{fmtDate(e.date, { day: "numeric" })}</b>
                    {fmtDate(e.date, { month: "short" })}
                  </span>
                  <div>
                    <b>{e.title}</b>
                    <small>
                      {fmtTime(e.start)} · {e.venue}
                    </small>
                  </div>
                  <span
                    className={`badge b-${e.attendees.length >= e.seats ? "warn" : "ok"}`}
                  >
                    {e.attendees.length} / {e.seats} seats
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">
              No upcoming events. Add one from Events.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
