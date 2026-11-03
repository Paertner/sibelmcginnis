import { getDemoState, usesDatabase } from "@/lib/store";
import { deliverySummary } from "@/lib/announcement-mail";
import { RetryEmailsButton } from "./retry-emails-button";
import { AnnouncementContent } from "./announcement-content";
export async function AnnouncementHistory() {
  const state = getDemoState();
  const delivery = usesDatabase() ? await deliverySummary() : undefined;
  return (
    <section className="announcement-history">
      <h2>Published announcements</h2>
      <p className="muted">
        Account messages and emails. Email drafts (files) have not been sent;
        sent emails are listed with their result.
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
                {a.emailStatus === "sent"
                  ? `Emailed ${delivery?.get(a.id)?.sent ?? 0}${delivery?.get(a.id)?.failed ? ` · ${delivery.get(a.id)!.failed} failed` : ""}`
                  : a.emailStatus === "prepared"
                    ? "Email prepared"
                    : "Account message"}
              </span>
            </summary>
            <div className="history-content">
              <AnnouncementContent announcement={a} name="Sibel" />
              {delivery?.get(a.id) ? (
                <RetryEmailsButton
                  announcementId={a.id}
                  failed={delivery.get(a.id)!.failed}
                />
              ) : null}
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
