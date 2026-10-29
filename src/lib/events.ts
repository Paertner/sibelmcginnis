import "server-only";
import { getStore, type Booking, type EventItem, type Session } from "./store";
import type { CalendarEvent } from "./calendar";
import { eventUrl, meetingUrl } from "./site-url";
export function sessionEvent(s: Session): CalendarEvent {
  return {
    id: s.id,
    title: `Morning Coffee Circle: ${s.topic}`,
    date: s.date,
    time: getStore().settings.meetingTime,
    minutes: getStore().settings.meetingMinutes,
    url: meetingUrl("session", s.id),
    details: `Open your protected session page when it is time to join. Active Premium membership is checked at entry.\nTopic: ${s.topic}`,
  };
}
export function bookingEvent(b: Booking): CalendarEvent {
  return {
    id: b.id,
    title: "Consultation with Sibel",
    date: b.date,
    time: b.time,
    minutes: getStore().settings.consultMinutes,
    url: b.source === "company" ? b.zoom : meetingUrl("booking", b.id),
    details:
      b.source === "company"
        ? `Consultation for ${b.company}. Join with the meeting link.\nTopic: ${b.topic}`
        : `Open your protected consultation page when it is time to join. Active Premium membership is checked at entry.\nTopic: ${b.topic}`,
  };
}
/** Minutes between two HH:MM times on the same day (at least 15). */
const minutesBetween = (start: string, end: string) => {
  const at = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return Math.max(15, at(end) - at(start));
};
/** An in-person event for the calendar: the venue is the location, the event page is the link. */
export function eventCalendarEvent(e: EventItem): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.start,
    minutes: minutesBetween(e.start, e.end),
    url: eventUrl(e.id),
    location: [e.venue, e.address].filter(Boolean).join(", "),
    details: `${e.summary}\n\nDetails and RSVP: ${eventUrl(e.id)}`.trim(),
  };
}
