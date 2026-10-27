import { siteText } from "@/lib/site-copy";
import { googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";
export function CalendarButtons({
  event,
  kind,
}: {
  event: CalendarEvent;
  kind: "session" | "booking";
}) {
  return (
    <span className="calbtns">
      <a
        className="btn btn-sm btn-ghost"
        href={googleCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {siteText("calendar-buttons.google-calendar")}
      </a>{" "}
      <a
        className="btn btn-sm btn-ghost"
        href={`/api/calendar/${kind}/${event.id}`}
      >
        {siteText("calendar-buttons.apple-outlook-ics")}
      </a>
    </span>
  );
}
