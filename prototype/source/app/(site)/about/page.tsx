import { siteImageProps } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Meet Sibel" };

export default async function Page() {
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{siteText("about.about")}</p>
          <h1>{siteText("about.sibel-mcginnis")}</h1>
          <p>
            {siteText(
              "about.corporate-trainer-life-coach-and-mentor-who-views-transformation-",
            )}
          </p>
        </div>
      </div>

      <section className="block">
        <div className="wrap split">
          <Image
            {...siteImageProps("about.portrait")} alt={siteImageProps("about.portrait").alt}
            className="photo"

            width={900}
            height={1000}
          />
          <div>
            <p>
              {siteText(
                "about.her-career-began-as-an-entrepreneur-shortly-after-college-over-ti",
              )}
            </p>
            <p>
              {siteText(
                "about.today-her-work-is-grounded-in-the-belief-that-meaningful-change-u",
              )}
            </p>
            <p>
              {siteText(
                "about.meaningful-change-is-a-craft-not-a-one-time-event-by-uncovering-i",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="block bg-cream">
        <div className="wrap">
          <div className="center" style={{ marginBottom: "30px" }}>
            <h2>{siteText("about.what-to-expect")}</h2>
          </div>
          <div className="grid g2">
            <div className="card">
              <h3>{siteText("about.a-collaborative-partnership")}</h3>
              <p className="muted">
                {siteText(
                  "about.grounded-in-empathy-integrity-and-accountability",
                )}
              </p>
            </div>
            <div className="card">
              <h3>{siteText("about.clear-actionable-roadmaps")}</h3>
              <p className="muted">
                {siteText("about.tangible-next-steps-and-measurable-progress")}
              </p>
            </div>
            <div className="card">
              <h3>{siteText("about.mindful-coaching")}</h3>
              <p className="muted">
                {siteText(
                  "about.respects-your-pace-while-gently-expanding-possibilities",
                )}
              </p>
            </div>
            <div className="card">
              <h3>{siteText("about.a-holistic-view-of-life")}</h3>
              <p className="muted">
                {siteText("about.when-one-area-improves-others-follow")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap narrow center">
          <h2>{siteText("about.working-with-organizations")}</h2>
          <p>
            {siteText(
              "about.sibel-partners-with-organizations-to-unlock-sustainable-growth-th",
            )}
          </p>
          <Link className="btn" href="/solutions">
            {siteText("about.explore-solutions")}
          </Link>
        </div>
      </section>
    </>
  );
}
