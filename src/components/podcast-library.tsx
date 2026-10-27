import { siteText } from "@/lib/site-copy";
import { getDemoState, getStore } from "@/lib/store";
import { fmtDate } from "@/lib/dates";

export function PodcastLibrary({ allowed }: { allowed: boolean }) {
  const episodes = getStore()
    .podcasts.filter((ep) => ep.status === "published")
    .toSorted((a, b) => b.num - a.num);
  return (
    <div className="card podcast-library">
      {episodes.length ? (
        episodes.map((ep) => (
          <div
            className={`ep ${allowed ? "" : "locked"}`}
            id={ep.id}
            key={ep.id}
          >
            <div className="ep-n">{ep.num}</div>
            <div>
              <h3>{ep.title}</h3>
              <p className="muted">
                {fmtDate(ep.date)} · {ep.duration}{" "}
                {siteText("podcast-library.min")}
              </p>
              <p className="muted">{ep.description}</p>
              {allowed ? (
                getDemoState().audio.has(ep.id) ? (
                  <audio controls preload="none" src={`/api/audio/${ep.id}`}>
                    {siteText(
                      "podcast-library.your-browser-does-not-support-audio-playback",
                    )}
                  </audio>
                ) : (
                  <p className="hint audio-hint">
                    {siteText(
                      "podcast-library.audio-has-not-been-uploaded-for-this-review-episode",
                    )}
                  </p>
                )
              ) : (
                <span className="badge b-premium">
                  {siteText("podcast-library.premium")}
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="muted">
          {siteText("podcast-library.new-episodes-will-appear-here-soon")}
        </p>
      )}
    </div>
  );
}
