import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { isPremium } from "@/lib/access";
import { PodcastLibrary } from "@/components/podcast-library";
export const metadata = { title: "Podcast" };
export default async function Podcast() {
  const user = await getUser(),
    allowed = isPremium(user?.role);
  const episodes = getStore()
    .podcasts.filter((p) => p.status === "published")
    .toSorted((a, b) => b.num - a.num);
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{siteText("podcast.premium-audio")}</p>
          <h1>{siteText("podcast.the-morning-coffee-podcast")}</h1>
          <p>
            {siteText(
              "podcast.missed-a-saturday-catch-up-on-every-conversation-plus-bonus-episo",
            )}
          </p>
        </div>
      </div>
      <section className="block">
        <div className="wrap narrow">
          {!allowed ? (
            <div className="zoomcard locked section-gap">
              <h2>{siteText("podcast.unlock-every-episode")}</h2>
              <p>
                {episodes.length}{" "}
                {siteText("podcast.episodes-and-counting-included-with-your")}
                {getStore().settings.premiumPrice}
                {siteText("podcast.month-premium-membership")}
              </p>
              <Link className="btn" href="/morning-coffee#plans">
                {siteText("podcast.see-membership-plans")}
              </Link>
            </div>
          ) : null}
          <PodcastLibrary allowed={allowed} />
          <p className="section-top">
            <Link href="/account">
              {siteText("podcast.back-to-my-account")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
