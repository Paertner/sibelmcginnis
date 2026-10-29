import "server-only";
import { getStore, type CompanyLink } from "./store";
import { addDays, fmtDate, today } from "./dates";

/** A link works for a week; the admin can add more time. */
export const LINK_DAYS = 7;
/** Companies can book up to this many days ahead, like members. */
export const BOOKING_DAYS = 21;

export type LinkStatus = "active" | "used" | "expired" | "revoked";
export function linkStatus(link: CompanyLink): LinkStatus {
  if (link.revoked) return "revoked";
  if (link.bookingId) return "used";
  return link.expiresAt < today() ? "expired" : "active";
}
export const findLink = (token: string) =>
  token.length >= 24
    ? (getStore().companyLinks ?? []).find((l) => l.token === token)
    : undefined;

const minutes = (t: string) =>
  Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
/** True when a time is already taken by any live booking (member or company). */
export const slotTaken = (date: string, time: string) =>
  getStore().bookings.some(
    (b) =>
      b.status !== "cancelled" &&
      b.date === date &&
      Math.abs(minutes(b.time) - minutes(time)) <
        getStore().settings.consultMinutes,
  );
/** True when the admin offers this date and time (within the booking window). */
export function slotOffered(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date <= today()) return false;
  if (date > addDays(today(), BOOKING_DAYS)) return false;
  const day = new Date(date + "T12:00:00Z");
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date)
    return false;
  const times =
    (getStore().availability as Record<string, string[]>)[day.getUTCDay()] ??
    [];
  return times.includes(time);
}
/** Days a company can pick: the admin's open times that nobody has booked. */
export function companyDays() {
  return Array.from({ length: BOOKING_DAYS }, (_, i) =>
    addDays(today(), i + 1),
  )
    .map((date) => ({
      date,
      label: fmtDate(date),
      times: (
        (getStore().availability as Record<string, string[]>)[
          new Date(date + "T12:00:00Z").getUTCDay()
        ] ?? []
      ).filter((t) => !slotTaken(date, t)),
    }))
    .filter((d) => d.times.length);
}
/** The name shown for a booking: the member's, or the company's. */
export function bookingName(b: {
  memberId: string;
  source?: string;
  company?: string;
}) {
  if (b.source === "company") return b.company || "Company";
  return (
    getStore().members.find((m) => m.id === b.memberId)?.name ??
    "Removed member"
  );
}
