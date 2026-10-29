import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { meetingAccess } from "@/lib/meeting-access";
import { fmtDate } from "@/lib/dates";
import { liveZoom } from "@/lib/meetings";
import { registerAttendee } from "@/lib/zoom";
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
  // The membership was checked just above; only now does the member get a personal Zoom link.
  let joinUrl = "";
  let zoomProblem = false;
  if (access.status === 200 && user && access.zoomId && liveZoom()) {
    try {
      joinUrl = await registerAttendee(access.zoomId, {
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error("[zoom] registration failed", error);
      zoomProblem = true;
    }
  }
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
              {joinUrl ? (
                <>
                  <a
                    className="btn"
                    href={joinUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Join on Zoom
                  </a>
                  <p className="hint">
                    This link is just for you. Please do not share it; it stops
                    working if your Premium access ends.
                  </p>
                </>
              ) : zoomProblem ? (
                <p role="alert">
                  We could not prepare your Zoom link just now. Please try again
                  in a minute, or contact Sibel if it keeps happening.
                </p>
              ) : access.zoomId ? null : liveZoom() ? (
                <p>
                  The Zoom meeting for this session has not been set up yet.
                  Please check back soon.
                </p>
              ) : (
                <>
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
              )}
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
