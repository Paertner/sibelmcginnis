import type { CompanyLink } from "./store";
import { today } from "./dates";

// Plain helpers with no server data, so admin screens (client components) can use them too.

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
