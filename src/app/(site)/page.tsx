import { siteBackground } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { getStore } from "@/lib/store";
import { PostCards } from "@/components/post-cards";
import { getUser } from "@/lib/auth";

export default async function Page() {
  const settings = getStore().settings;
  const role = (await getUser())?.role ?? "visitor";
  const latest = getStore()
    .posts.filter((p) => p.status === "published")
    .toSorted((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  return (
    <>
      <section className="hero2">
        <div
          className="ghost"
          style={{ fontSize: "clamp(3.2rem,13.5vw,12.5rem)" }}
        >
          {siteText("home.sibel-mcginnis")}
        </div>
        <div className="hero-panel">
          <div className="wrap hero-grid">
            <div
              className="hero-photo"
              id="heroPhoto"
              {...siteBackground("home.hero")}
            ></div>
            <div className="hero-copy">
              <div className="avatars">
                <div className="stack">
                  <span style={{ background: "#C0A385" }}>
                    {siteText("home.ah")}
                  </span>
                  <span style={{ background: "#d9c3ab" }}>
                    {siteText("home.ld")}
                  </span>
                  <span style={{ background: "#a98b6d" }}>
                    {siteText("home.na")}
                  </span>
                </div>
                <span className="tag">
                  <span>{settings.meetingDay}</span> ·{" "}
                  <span>{settings.meetingTime}</span>
                </span>
              </div>
              <h1>{settings.heroTitle}</h1>
              <p className="hero-intro">{settings.heroSub}</p>
              <div className="hero-btns">
                <Link className="btn" href="/morning-coffee#plans">
                  {siteText("home.join-our-community")}
                </Link>
                <Link
                  className="btn btn-ghost on-dark"
                  href="/solutions"
                  style={{ color: "#ededed" }}
                >
                  {siteText("home.explore-coaching")}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="strip">
          <div className="wrap">
            <div>
              <b>{siteText("home.90-min")}</b>
              {siteText("home.weekly-live-sessions")}
            </div>
            <div>
              <b>{siteText("home.zoom")}</b>
              {siteText("home.join-from-anywhere")}
            </div>
            <div>
              <b>{siteText("home.4")}</b>
              {siteText("home.quarterly-themes-a-year")}
            </div>
            <div>
              <b>{siteText("home.ladies-only")}</b>
              {siteText("home.warm-supportive-circle")}
            </div>
          </div>
        </div>
      </section>

      <section className="programs dark" style={{ marginTop: "14px" }}>
        <div className="wrap">
          <div className="shead on-dark">
            <div>
              <span className="pill">{siteText("home.programs")}</span>
            </div>
            <h2>{siteText("home.ways-to-grow-with-sibel")}</h2>
            <p style={{ color: "#9a9a9a" }}>
              {siteText(
                "home.join-a-weekly-circle-book-one-on-one-time-or-catch-up-on-the-podc",
              )}
            </p>
          </div>
          <div className="pcards">
            <Link className="pcard" href="/morning-coffee">
              <div
                className="img"
                {...siteBackground("home.program-circle")}
              ></div>
              <h3>{siteText("home.morning-coffee-circle")}</h3>
              <p>
                {siteText(
                  "home.a-ladies-only-weekly-zoom-conversation-on-emotional-health-self-a",
                )}
              </p>
              <span className="btn">{siteText("home.join-the-circle")}</span>
            </Link>
            <Link className="pcard" href="/solutions">
              <div
                className="img"
                {...siteBackground("home.program-coaching")}
              ></div>
              <h3>{siteText("home.one-on-one-coaching")}</h3>
              <p>
                {siteText(
                  "home.guided-reflection-and-practical-next-steps-with-sibel-included-ev",
                )}
              </p>
              <span className="btn">{siteText("home.schedule-a-session")}</span>
            </Link>
            <Link className="pcard" href="/podcast">
              <div
                className="img"
                {...siteBackground("home.program-podcast")}
              ></div>
              <h3>{siteText("home.the-podcast")}</h3>
              <p>
                {siteText(
                  "home.missed-a-saturday-listen-to-every-conversation-plus-bonus-episode",
                )}
              </p>
              <span className="btn">{siteText("home.hear-the-episodes")}</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="shead" style={{ gridTemplateColumns: "1fr 2fr" }}>
            <div>
              <span className="pill">
                {siteText("home.about-the-community")}
              </span>
            </div>
            <p className="lead-text" style={{ color: "#8a8a8a" }}>
              {siteText("home.with-a")}{" "}
              <em>{siteText("home.weekly-circle")}</em>{" "}
              {siteText(
                "home.built-for-honest-reflection-our-mission-is-to-help-women-slow-dow",
              )}{" "}
              <em>{siteText("home.reconnect-with-themselves")}</em>{" "}
              {siteText("home.and-grow-with-care")}
            </p>
          </div>
          <div className="bento">
            <div className="b-dark">
              <div>
                <span
                  className="pill"
                  style={{
                    background: "rgba(255,255,255,.1)",
                    color: "#ededed",
                  }}
                >
                  {siteText("home.how-it-works")}
                </span>
              </div>
              <div>
                <h3>
                  {siteText(
                    "home.create-a-step-by-step-reflection-practice-you-can-actually-follow",
                  )}
                </h3>
              </div>
              <ul style={{ padding: "0", margin: "0" }}>
                <li>
                  {siteText("home.notice-what-you-feel-without-judgement")}
                </li>
                <li>{siteText("home.name-what-you-need")}</li>
                <li>{siteText("home.take-one-small-aligned-action")}</li>
              </ul>
            </div>
            <div className="b-img" {...siteBackground("home.reflection")}></div>
            <div className="b-light">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <span className="big-num">
                  {siteText("home.90")}
                  <small style={{ fontSize: "1.1rem", letterSpacing: "0" }}>
                    {" "}
                    {siteText("home.min")}
                  </small>
                </span>
                <span style={{ fontSize: ".9rem" }}>
                  {siteText("home.saturday-circle")}
                </span>
              </div>
              <div className="meter">
                <div>
                  <span>{siteText("home.quarterly-themes")}</span>
                  <span>{siteText("home.4-year")}</span>
                </div>
                <i style={{ "--w": "100%" } as React.CSSProperties}></i>
                <div>
                  <span>{siteText("home.topics-explored")}</span>
                  <span>{siteText("home.11")}</span>
                </div>
                <i style={{ "--w": "78%" } as React.CSSProperties}></i>
                <div>
                  <span>{siteText("home.zoom-notes-podcast")}</span>
                  <span>{siteText("home.included")}</span>
                </div>
                <i style={{ "--w": "92%" } as React.CSSProperties}></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block" style={{ paddingTop: "0" }}>
        <div className="wrap">
          <div className="shead">
            <div>
              <span className="pill">{siteText("home.why-join")}</span>
            </div>
            <h2>
              {siteText("home.a-community-experience-for-lasting-growth")}
            </h2>
            <p>
              {siteText(
                "home.every-session-is-warm-practical-and-deeply-connected-to-the-life-",
              )}
            </p>
          </div>
          <div className="frows">
            <div className="frow">
              <h3>{siteText("home.guided-gentle-conversations")}</h3>
              <p>
                {siteText(
                  "home.structured-reflection-on-emotional-awareness-boundaries-and-confi",
                )}
              </p>
              <div
                className="th"
                {...siteBackground("home.feature-conversations")}
              ></div>
            </div>
            <div className="frow">
              <h3>{siteText("home.catch-up-anytime")}</h3>
              <p>
                {siteText(
                  "home.post-meeting-notes-and-a-premium-podcast-mean-you-never-lose-the-",
                )}
              </p>
              <div
                className="th"
                {...siteBackground("home.feature-catchup")}
              ></div>
            </div>
            <div className="frow">
              <h3>{siteText("home.support-that-lasts")}</h3>
              <p>
                {siteText(
                  "home.genuine-community-collective-insights-and-lasting-friendships-plu",
                )}
              </p>
              <div
                className="th"
                {...siteBackground("home.feature-support")}
              ></div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta dark">
        <div className="wrap">
          <div>
            <h2>{siteText("home.ready-to-step-into-your-next-chapter")}</h2>
            <div className="hero-btns">
              <Link className="btn" href="/morning-coffee#plans">
                {siteText("home.join-morning-coffee")}
              </Link>
              <Link className="btn btn-ghost" href="/contact">
                {siteText("home.ask-a-question")}
              </Link>
            </div>
            <p
              style={{
                margin: "34px 0 0",
                color: "#9a9a9a",
                maxWidth: "420px",
              }}
            >
              {siteText(
                "home.your-transformation-begins-with-one-honest-conversation-and-the-l",
              )}
            </p>
          </div>
          <div className="img" {...siteBackground("home.join")}></div>
        </div>
      </section>

      <section className="block" id="plans">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "40px" }}>
            <p className="eyebrow">{siteText("morning-coffee.membership")}</p>
            <h2>{siteText("morning-coffee.choose-how-you-d-like-to-join")}</h2>
            <p className="muted">
              {siteText(
                "morning-coffee.flexible-membership-upgrade-pause-or-cancel-anytime",
              )}
            </p>
          </div>
          <div className="plan-solo">
            <div className="plan-solo-main">
              <span className="name">
                {siteText("morning-coffee.premium-member")}
              </span>
              <p className="plan-solo-sub">
                {siteText("morning-coffee.the-full-morning-coffee-experience")}
              </p>
              <div className="plan-solo-price">
                <span className="price">
                  $<span>{settings.premiumPrice}</span>
                </span>
                <small>{siteText("morning-coffee.month")}</small>
              </div>
              <Link className="btn" href="/join?plan=premium">
                {siteText("morning-coffee.join-premium")}
              </Link>
            </div>
            <div className="plan-solo-list">
              <h4>{siteText("morning-coffee.what-s-included")}</h4>
              <ul className="ticks">
                <li>
                  {siteText(
                    "morning-coffee.protected-access-to-every-saturday-session",
                  )}
                </li>
                <li>
                  <span>{settings.consultsPerMonth}</span>{" "}
                  {siteText(
                    "morning-coffee.one-on-one-consultation-with-sibel-month",
                  )}
                </li>
                <li>
                  {siteText(
                    "morning-coffee.premium-posts-quarterly-themes-workbooks",
                  )}
                </li>
                <li>
                  {siteText(
                    "morning-coffee.full-access-to-the-morning-coffee-podcast-audio",
                  )}
                </li>
                <li>
                  {siteText("morning-coffee.session-notes-for-every-saturday")}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        className="block bg-cream"
        style={{ borderRadius: "var(--r-lg)", margin: "0 14px" }}
      >
        <div className="wrap center">
          <span className="pill" style={{ background: "#fff" }}>
            {siteText("home.topics")}
          </span>
          <h2>{siteText("home.what-we-explore-in-our-saturday-meetings")}</h2>
          <div className="chips" id="topics" style={{ marginTop: 28 }}>
            {settings.topics.map((topic) => (
              <span className="chip" key={topic}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="shead">
            <div>
              <span className="pill">{siteText("home.from-the-blog")}</span>
            </div>
            <h2>{siteText("home.insights-inspiration-and-connection")}</h2>
            <p>
              {siteText(
                "home.some-posts-are-open-to-everyone-others-are-for-members",
              )}
            </p>
          </div>
          <div className="grid g3">
            <PostCards posts={latest} role={role} />
          </div>
          <p className="center" style={{ marginTop: "30px" }}>
            <Link className="btn btn-dark" href="/blog">
              {siteText("home.read-all-posts")}
            </Link>
          </p>
        </div>
      </section>

      <section className="block" style={{ paddingTop: "0" }}>
        <div className="wrap">
          <div className="shead">
            <div>
              <span className="pill">{siteText("home.faqs")}</span>
            </div>
            <h2>{siteText("home.frequently-asked-questions")}</h2>
            <p></p>
          </div>
          <div className="faq">
            <div>
              <details open>
                <summary>
                  {siteText("home.what-is-morning-coffee-community")}
                </summary>
                <p>
                  {siteText(
                    "home.a-ladies-only-online-community-with-a-weekly-virtual-meeting-dedi",
                  )}
                </p>
              </details>
              <details style={{ marginTop: "12px" }}>
                <summary>
                  {siteText("home.when-do-the-meetings-take-place")}
                </summary>
                <p>
                  <span>{settings.meetingDay}</span> {siteText("home.at")}{" "}
                  <span>{settings.meetingTime}</span>
                  {siteText("home.for-about-90-minutes-on-zoom")}
                </p>
              </details>
              <details style={{ marginTop: "12px" }}>
                <summary>{siteText("home.what-if-i-miss-a-session")}</summary>
                <p>
                  {siteText(
                    "home.premium-members-get-post-meeting-notes-and-the-podcast-to-catch-u",
                  )}
                </p>
              </details>
            </div>
            <div>
              <details>
                <summary>
                  {siteText("home.how-do-i-join-a-saturday-session")}
                </summary>
                <p>
                  {siteText(
                    "home.sign-in-as-a-premium-member-and-open-your-account-the-link-for-th",
                  )}
                </p>
              </details>
              <details style={{ marginTop: "12px" }}>
                <summary>
                  {siteText("home.are-one-on-one-consultations-included")}
                </summary>
                <p>
                  {siteText(
                    "home.yes-premium-membership-includes-a-monthly-one-on-one-consultation",
                  )}
                </p>
              </details>
              <details style={{ marginTop: "12px" }}>
                <summary>{siteText("home.can-i-cancel-anytime")}</summary>
                <p>
                  {siteText(
                    "home.yes-membership-is-flexible-and-you-can-pause-or-cancel-from-your-",
                  )}
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
