import "server-only";
import { getStore, type Booking, type Session } from "./store";
import type { CalendarEvent } from "./calendar";
import { meetingUrl } from "./site-url";
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
