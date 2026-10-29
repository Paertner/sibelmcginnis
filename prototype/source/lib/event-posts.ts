import { getStore, type EventItem } from "./store";
import { today } from "./dates";

/** "18:30" becomes "6:30 PM". */
export function fmtTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
export const timeRange = (e: Pick<EventItem, "start" | "end">) =>
  `${fmtTime(e.start)} – ${fmtTime(e.end)}`;
export const isPaid = (e: Pick<EventItem, "price">) =>
  !!e.price && e.price.trim().toLowerCase() !== "free";
export const seatsLeft = (e: EventItem) =>
  Math.max(0, e.seats - e.attendees.length);
export const isPast = (e: Pick<EventItem, "date">) => e.date < today();
export const publishedEvents = () =>
  (getStore().events ?? []).filter((e) => e.status === "published");
export const upcomingEvents = () =>
  publishedEvents()
    .filter((e) => !isPast(e))
    .toSorted((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
export const pastEvents = () =>
  publishedEvents()
    .filter(isPast)
    .toSorted((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
/** Image slot for an event cover; falls back to a blog cover until one is chosen. */
export const eventSlot = (e: Pick<EventItem, "id">) => `event.${e.id}`;
