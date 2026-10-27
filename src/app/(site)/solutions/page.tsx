import { siteText } from "@/lib/site-copy";
import Link from "next/link";

export const metadata = { title: "Solutions" };

export default async function Page() {
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{siteText("solutions.solutions")}</p>
          <h1>
            {siteText(
              "solutions.personal-and-professional-growth-guided-with-clarity-and-experien",
            )}
          </h1>
          <p>
            {siteText(
              "solutions.tailored-solutions-for-women-seeking-personal-growth-as-well-as-o",
            )}
          </p>
        </div>
      </div>

      <section className="block">
        <div className="wrap grid g3">
          <div className="card">
            <h3>{siteText("solutions.personal-coaching-with-sibel")}</h3>
            <p className="muted">
              {siteText(
                "solutions.guided-reflection-open-dialogue-and-actionable-strategies-to-help",
              )}
            </p>
            <ul className="ticks">
              <li>{siteText("solutions.one-on-one-mentorship")}</li>
              <li>
                {siteText(
                  "solutions.guided-exploration-of-emotional-awareness",
                )}
              </li>
              <li>{siteText("solutions.practical-tools-and-exercises")}</li>
              <li>
                {siteText("solutions.mindful-support-that-respects-your-pace")}
              </li>
            </ul>
            <p>
              <span className="badge b-premium">
                {siteText("solutions.included-with-premium")}
              </span>
            </p>
            <Link className="btn" href="/account?tab=book">
              {siteText("solutions.schedule-a-session")}
            </Link>
          </div>
          <div className="card">
            <h3>{siteText("solutions.morning-coffee-community-membership")}</h3>
            <p className="muted">
              {siteText(
                "solutions.a-weekly-online-gathering-where-women-connect-reflect-and-grow-to",
              )}
            </p>
            <ul className="ticks">
              <li>{siteText("solutions.weekly-90-minute-sessions")}</li>
              <li>{siteText("solutions.quarterly-themes")}</li>
              <li>{siteText("solutions.post-meeting-notes-podcast")}</li>
              <li>{siteText("solutions.tools-for-daily-practice")}</li>
              <li>{siteText("solutions.community-support")}</li>
            </ul>
            <Link className="btn" href="/morning-coffee#plans">
              {siteText("solutions.join-the-community")}
            </Link>
          </div>
          <div className="card">
            <h3>{siteText("solutions.organizational-corporate-solutions")}</h3>
            <p className="muted">
              {siteText(
                "solutions.behavioral-science-and-practical-execution-to-create-measurable-i",
              )}
            </p>
            <ul className="ticks">
              <li>{siteText("solutions.discovery-and-diagnostics")}</li>
              <li>{siteText("solutions.co-designed-coaching-training")}</li>
              <li>{siteText("solutions.leadership-development")}</li>
              <li>
                {siteText("solutions.workshops-virtual-sessions-microlearning")}
              </li>
            </ul>
            <Link className="btn" href="/contact">
              {siteText("solutions.request-a-consultation")}
            </Link>
          </div>
        </div>
      </section>

      <section className="block bg-cream">
        <div className="wrap narrow center">
          <h2>{siteText("solutions.ready-to-begin")}</h2>
          <p>
            {siteText(
              "solutions.whether-you-are-seeking-personal-growth-meaningful-connection-or-",
            )}
          </p>
          <Link className="btn" href="/contact">
            {siteText("solutions.get-started")}
          </Link>
        </div>
      </section>
    </>
  );
}
