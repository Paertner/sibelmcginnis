import { getDemoState } from "@/lib/store";
import { AnnouncementContent } from "./announcement-content";
export function AnnouncementHistory() {
  const state = getDemoState();
  return (
    <section className="announcement-history">
      <h2>Published announcements</h2>
      <p className="muted">
        Account messages and individual email drafts. Drafts have not been sent.
      </p>
      {state.data.announcements.toReversed().map((a) => {
        const drafts = state.emailDrafts.filter(
          (d) => d.announcementId === a.id,
        );
        return (
          <details className="panel announcement-history-item" key={a.id}>
            <summary>
              <span>
                <b>{a.subject}</b>
                <small>
                  {a.date} ·{" "}
                  {a.recipientIds
                    ? `${a.recipientIds.length} recipients`
                    : `${a.audience} members`}
                </small>
              </span>
              <span className="badge b-grey">
                {a.emailStatus === "prepared"
                  ? "Email prepared"
                  : "Account message"}
              </span>
            </summary>
            <div className="history-content">
              <AnnouncementContent announcement={a} name="Sibel" />
              {drafts.length ? (
                <div className="email-drafts">
                  <h3>Individual email drafts</h3>
                  <p className="hint">
                    Each file contains one recipient and a personalized message.
                    Uploaded images are embedded.
                  </p>
                  {drafts.map((d) => (
                    <div className="list-item" key={d.id}>
                      <span>
                        <b>{d.name}</b>
                        <br />
                        <small>{d.to}</small>
                      </span>
                      <a
                        className="btn btn-sm btn-ghost"
                        href={`/api/announcements/${a.id}/email/${d.id}`}
                      >
                        Download email draft
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </details>
        );
      })}
    </section>
  );
}
