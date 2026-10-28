import { siteImageProps } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import Image from "next/image";
import { getStore } from "@/lib/store";

export const metadata = { title: "Membership" };

export default async function Page() {
  const settings = getStore().settings;
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <p className="eyebrow">
            {siteText("morning-coffee.ladies-only-online")}
          </p>
          <h1>{siteText("morning-coffee.morning-coffee-community")}</h1>
          <p>
            {siteText(
              "morning-coffee.a-weekly-gathering-where-women-connect-reflect-and-grow-together",
            )}{" "}
            <span>{settings.meetingDay}</span> {siteText("morning-coffee.at")}{" "}
            <span>{settings.meetingTime}</span>.
          </p>
        </div>
      </div>

      <section className="block">
        <div className="wrap split">
          <Image
            {...siteImageProps("community.gathering")}
            alt={siteImageProps("community.gathering").alt}
            className="photo"
            style={{
              ...siteImageProps("community.gathering").style,
              aspectRatio: "4/3",
            }}

            width={900}
            height={1000}
            loading="eager"
          />
          <div>
            <h2>
              {siteText("morning-coffee.a-structured-space-for-shared-insight")}
            </h2>
            <p>
              {siteText(
                "morning-coffee.each-week-we-explore-topics-that-foster-confidence-empathy-and-gr",
              )}
            </p>
            <ul className="ticks">
              <li>{siteText("morning-coffee.weekly-90-minute-sessions")}</li>
              <li>
                {siteText(
                  "morning-coffee.quarterly-themes-for-holistic-growth",
                )}
              </li>
              <li>
                {siteText(
                  "morning-coffee.post-meeting-notes-and-a-podcast-if-you-miss-a-session",
                )}
              </li>
              <li>
                {siteText(
                  "morning-coffee.tools-and-resources-for-daily-practice",
                )}
              </li>
              <li>
                {siteText(
                  "morning-coffee.genuine-community-support-and-lasting-friendships",
                )}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="block bg-cream" id="plans">
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

      <section className="block">
        <div className="wrap narrow">
          <h2 className="center">{siteText("morning-coffee.questions")}</h2>
          <div className="card" style={{ marginBottom: "14px" }}>
            <h3>{siteText("morning-coffee.can-i-miss-a-session")}</h3>
            <p className="muted" style={{ margin: "0" }}>
              {siteText(
                "morning-coffee.of-course-premium-members-get-post-meeting-notes-and-a-podcast-to",
              )}
            </p>
          </div>
          <div className="card" style={{ marginBottom: "14px" }}>
            <h3>
              {siteText("morning-coffee.how-do-i-join-a-saturday-session")}
            </h3>
            <p className="muted" style={{ margin: "0" }}>
              {siteText(
                "morning-coffee.sign-in-and-open-your-account-the-link-for-the-next-saturday-sess",
              )}
            </p>
          </div>
          <div className="card">
            <h3>{siteText("morning-coffee.can-i-cancel")}</h3>
            <p className="muted" style={{ margin: "0" }}>
              {siteText(
                "morning-coffee.yes-anytime-from-your-account-no-questions-asked",
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
