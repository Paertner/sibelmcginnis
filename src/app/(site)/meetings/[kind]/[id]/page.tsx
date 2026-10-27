import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { meetingAccess } from "@/lib/meeting-access";
import { fmtDate } from "@/lib/dates";
export const metadata = {
  title: "Session access",
  robots: { index: false, follow: false },
};
export default async function Meeting({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params,
    user = await getUser(),
    access = meetingAccess(user, kind, id);
  return (
    <section className="block">
      <div className="wrap narrow">
        <div className="card meeting-entry">
          <span className="pill">
            {siteText("meetings.morning-coffee-community")}
          </span>
          {access.status === 200 ? (
            <>
              <h1>{access.title}</h1>
              <p>
                {fmtDate(access.date!)} · {access.time} · {access.minutes}{" "}
                {siteText("meetings.minutes")}
              </p>
              <div className="entry-success">
                <b>{siteText("meetings.your-premium-access-is-active")}</b>
                <p>
                  {siteText(
                    "meetings.your-membership-is-checked-each-time-you-open-this-page-including",
                  )}
                </p>
              </div>
              <p>
                {siteText(
                  "meetings.zoom-registration-is-not-connected-in-this-review-a-direct-meetin",
                )}
              </p>
              <p className="hint">
                {siteText(
                  "meetings.the-live-service-must-issue-a-personal-zoom-registration-and-revo",
                )}
              </p>
            </>
          ) : (
            <>
              <h1>
                {access.status === 401
                  ? siteText("meetings.sign-in-to-access-your-session")
                  : access.status === 403
                    ? siteText(
                        "meetings.an-active-premium-membership-is-required",
                      )
                    : siteText("meetings.session-unavailable")}
              </h1>
              <p>
                {access.status === 403
                  ? siteText(
                      "meetings.your-premium-access-has-ended-or-is-inactive-a-saved-calendar-inv",
                    )
                  : access.status === 401
                    ? siteText(
                        "meetings.use-your-member-account-to-check-access-a-saved-link-is-not-an-ad",
                      )
                    : siteText(
                        "meetings.this-session-or-consultation-is-not-available-to-your-account",
                      )}
              </p>
              {access.status === 401 ? (
                <Link className="btn" href="/login">
                  {siteText("meetings.sign-in")}
                </Link>
              ) : access.status === 403 ? (
                <Link className="btn" href="/account?tab=membership">
                  {siteText("meetings.review-membership")}
                </Link>
              ) : null}
            </>
          )}
          <p className="section-top">
            <Link href="/account">
              {siteText("meetings.back-to-my-account")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
