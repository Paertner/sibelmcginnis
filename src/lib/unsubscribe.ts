import "server-only";
import { getStore } from "./store";
import { emailCategories, withUnsubscribed } from "./email-preferences";
import { readUnsubscribe } from "./unsubscribe-token";

/** Who an unsubscribe link belongs to, or null when it is not valid. */
export function inspectUnsubscribe(token: string) {
  const secret = process.env.SETTINGS_SECRET;
  if (!secret || secret.length < 16 || !token) return null;
  const parsed = readUnsubscribe(secret, token);
  const member =
    parsed && getStore().members.find((m) => m.id === parsed.memberId);
  if (!parsed || !member) return null;
  const label =
    parsed.category === "all"
      ? "all"
      : (emailCategories.find((c) => c.key === parsed.category)?.label ??
        "these");
  return { member, category: parsed.category, label };
}

/** Switches off one kind of email, or all of them, the same way the account page does. */
export function applyUnsubscribe(token: string, scope: "category" | "all") {
  const found = inspectUnsubscribe(token);
  if (!found) return false;
  found.member.emailPreferences = withUnsubscribed(
    found.member.emailPreferences,
    scope === "all"
      ? "all"
      : (found.category as Parameters<typeof withUnsubscribed>[1]),
  );
  return true;
}
