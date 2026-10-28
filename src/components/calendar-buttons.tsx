import { siteText } from "@/lib/site-copy";
import { googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";
import { CalendarMenu } from "./calendar-menu";

export function CalendarButtons({
  event,
  kind,
}: {
  event: CalendarEvent;
  kind: "session" | "booking";
}) {
  const ics = `/api/calendar/${kind}/${event.id}`;
  return (
    <CalendarMenu
      label={siteText("calendar-buttons.add-to-calendar")}
      items={[
        {
          text: siteText("calendar-buttons.google-calendar"),
          href: googleCalendarUrl(event),
          external: true,
        },
        { text: siteText("calendar-buttons.apple-calendar"), href: ics },
        { text: siteText("calendar-buttons.outlook"), href: ics },
      ]}
    />
  );
}
