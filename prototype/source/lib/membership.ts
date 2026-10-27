import type { Role } from "./access";
export type Membership = {
  tier: string;
  status: string;
  premiumUntil?: string;
};
export function memberRole(
  member: Membership,
  now = Date.now(),
): Exclude<Role, "visitor" | "admin"> {
  return member.tier === "premium" &&
    member.status === "active" &&
    !!member.premiumUntil &&
    Date.parse(member.premiumUntil) > now
    ? "premium"
    : "free";
}
