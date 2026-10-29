import Link from "next/link";
import { notFound } from "next/navigation";
import { siteText } from "@/lib/site-copy";
import { requireMember } from "@/lib/auth";
import { isPremium } from "@/lib/access";
import { getDemoState, getStore } from "@/lib/store";
import { fmtDate, today } from "@/lib/dates";
import { BlockContent, textToBlocks } from "@/components/block-content";

export const metadata = { title: "Session notes" };
/** A past Saturday circle: full notes and its podcast audio, for Premium members. */
export default async function SessionNotes({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireMember(),
    data = getStore();
  const session = data.sessions.find((s) => s.id === id && s.date < today());
  if (!session) notFound();
  const premium = isPremium(user.role);
  const episode = data.podcasts.find(
    (p) => p.id === session.podcast && p.status === "published",
  );
  const audio = premium && episode && getDemoState().audio.has(episode.id);
  return (
    <article className="block session-page">
      <div className="wrap narrow">
        <Link className="muted" href="/account?tab=sessions">
          ← {siteText("session.all-session-notes")}
        </Link>
        <p className="session-page-eyebrow">
          {siteText("session.saturday-circle")} · {fmtDate(session.date)}
        </p>
        <h1>{session.topic}</h1>
        {premium ? (
          <>
            {audio ? (
              <div className="post-audio">
                <span>
                  {siteText("session.listen")} · #{episode!.num}{" "}
                  {episode!.title}
                </span>
                <audio
                  controls
                  preload="none"
                  src={`/api/audio/${episode!.id}`}
                />
              </div>
            ) : null}
            {session.notes || session.blocks?.length ? (
              <BlockContent
                blocks={session.blocks ?? textToBlocks(session.notes)}
              />
            ) : (
              <p className="muted">{siteText("account.notes-coming")}</p>
            )}
            {episode ? (
              <p className="section-top">
                <Link
                  className="btn btn-ghost"
                  href={`/account?tab=podcast#${episode.id}`}
                >
                  {siteText("account.open-the-full-podcast")}
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <div className="paywall">
            <div className="card">
              <h3>{siteText("account.session-notes-are-a-premium-feature")}</h3>
              <Link className="btn" href="/account?tab=membership">
                {siteText("account.see-premium")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
