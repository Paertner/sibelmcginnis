export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  minutes: number;
  details: string;
  url: string;
  /** Where it happens, for in-person events; the link is used when empty. */
  location?: string;
};
export function calendarTimes(event: CalendarEvent) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(event.time);
  if (!match) throw new Error("Invalid event time");
  const hours = match[3]
    ? (Number(match[1]) % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0)
    : Number(match[1]);
  const start = new Date(
    `${event.date}T${String(hours).padStart(2, "0")}:${match[2]}:00Z`,
  );
  const end = new Date(start.getTime() + event.minutes * 60000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}Z/g, "");
  // Floating event time matches the prototype. Confirm the host's timezone before live scheduling.
  return [stamp(start), stamp(end)];
}
export function googleCalendarUrl(event: CalendarEvent) {
  const [start, end] = calendarTimes(event);
  return (
    "https://calendar.google.com/calendar/render?" +
    new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${start}/${end}`,
      details: event.details,
      location: event.location || event.url,
    })
  );
}
export function createIcs(event: CalendarEvent) {
  const [start, end] = calendarTimes(event);
  const escape = (v: string) =>
    v
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/[,;]/g, "\\$&")
      .replace(/\r/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Morning Coffee Community//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escape(event.id)}@morningcoffee.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, "")}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.details)}`,
    `LOCATION:${escape(event.location || event.url)}`,
    `URL:${event.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Starting soon",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 lines must fold at 75 octets, including UTF-8 text.
  return (
    lines
      .map((line) => {
        let output = "",
          bytes = 0;
        for (const char of line) {
          const count = new TextEncoder().encode(char).length;
          if (bytes + count > 75) {
            output += "\r\n ";
            bytes = 1;
          }
          output += char;
          bytes += count;
        }
        return output;
      })
      .join("\r\n") + "\r\n"
  );
}
